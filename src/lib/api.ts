import type { ResumeData } from "@/lib/resume";

/**
 * The only place this app talks to the server.
 *
 * Everything that matters -- PDF and DOCX parsing, the Claude call, the ATS
 * export, the quota, every authorization decision -- happens in the Spring Boot
 * backend. This file posts and reads; it holds no API key and no prompt, and
 * nothing it believes about the current user is load-bearing. The admin console
 * hides itself from a non-admin because showing it would be confusing, not
 * because hiding it is what keeps anyone out.
 */

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://matchcv-ai-be.onrender.com/api"
).replace(/\/+$/, "");

/* ------------------------------------------------------------------ types */

export type Plan = "FREE" | "PRO";
export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "EXPIRED";
export type Role = "USER" | "ADMIN";

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SubscriptionResponse {
  plan: Plan;
  status: SubscriptionStatus;
  monthlyTailorings: number;
  used: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
  /** True while checkout is stubbed, so the UI can label the button honestly. */
  checkoutStubbed: boolean;
}

export interface MeResponse {
  user: UserResponse;
  subscription: SubscriptionResponse;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserResponse;
}

export interface BaseResumeSummary {
  id: number;
  label: string;
  sourceFilename: string | null;
  sourceType: string;
  characterCount: number;
  createdAt: string;
}

export interface BaseResumeDetail extends BaseResumeSummary {
  extractedText: string;
}

export interface TailoredResumeDetail {
  id: number;
  jobTitle: string;
  matchScore: number;
  modelName: string;
  createdAt: string;
  resume: ResumeData;
}

export interface TailoredResumeSummary {
  id: number;
  jobTitle: string;
  matchScore: number;
  baseResumeId: number | null;
  createdAt: string;
}

export interface PlanOption {
  plan: Plan;
  name: string;
  monthlyTailorings: number;
  priceLabel: string;
  features: string[];
}

/* ------------------------------------------------------------ admin types */

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  plan: Plan | null;
  planStatus: SubscriptionStatus | null;
  resumeCount: number;
  tailoringCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserPage {
  items: AdminUserSummary[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUserDetail {
  user: AdminUserSummary;
  subscription: SubscriptionResponse;
  resumes: BaseResumeSummary[];
  tailorings: TailoredResumeSummary[];
}

export interface AdminActivityEntry {
  type: "SIGNUP" | "TAILORING";
  userId: number;
  userName: string;
  userEmail: string;
  detail: string;
  matchScore: number | null;
  at: string;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  admins: number;
  newUsersLast7Days: number;
  freePlans: number;
  proPlans: number;
  totalResumes: number;
  totalTailorings: number;
  tailoringsLast7Days: number;
  /** Null until something has been tailored; there is no average of nothing. */
  averageMatchScore: number | null;
  recentSignups: AdminUserSummary[];
  recentActivity: AdminActivityEntry[];
}

export interface AdminUserFilters {
  query?: string;
  active?: boolean;
  role?: Role;
  page?: number;
  size?: number;
}

/* ------------------------------------------------------------------ errors */

/** The backend's single error shape, so there is one thing to parse. */
interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** 402 means the allowance is spent -- a prompt to upgrade, not a failure. */
  get isQuotaExhausted() {
    return this.status === 402;
  }

  /** The server is unreachable, as opposed to having refused the request. */
  get isOffline() {
    return this.status === 0;
  }
}

/** Turns anything thrown into something worth putting in front of a person. */
export function errorMessage(caught: unknown, fallback = "Something went wrong."): string {
  if (caught instanceof ApiError) {
    return caught.message;
  }
  if (caught instanceof Error && caught.message) {
    return caught.message;
  }
  return fallback;
}

/* ------------------------------------------------------------------ tokens */

const ACCESS_KEY = "tr.accessToken";
const REFRESH_KEY = "tr.refreshToken";

/**
 * Tokens live in localStorage.
 *
 * The honest trade-off: this is readable by any script that gets injected into
 * the page, which an httpOnly cookie would not be. The cookie route needs the
 * browser to talk to a same-origin proxy rather than straight to the API, so it
 * is a real change of shape rather than a flag -- worth doing before this is
 * public, and deliberately not done yet.
 */
export const tokens = {
  access: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY)),
  refresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  save(auth: AuthResponse) {
    localStorage.setItem(ACCESS_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/* ----------------------------------------------------------------- request */

async function toError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // A non-JSON body means the request did not reach the application --
    // a proxy, a wrong port, or the server being down.
  }
  return new ApiError(
    response.status,
    body?.message ?? `Request failed (${response.status}).`,
    body?.fieldErrors ?? {},
  );
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Set for multipart; fetch adds its own boundary so we must not. */
  formData?: FormData;
  auth?: boolean;
  /** Internal: stops a refresh loop if the refresh call itself 401s. */
  retrying?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, auth = true, retrying = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = tokens.access();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError(
      0,
      `Could not reach the API at ${BASE_URL}. Is the backend running?`,
    );
  }

  // One silent refresh attempt, then give up. Without the guard, an expired
  // refresh token would bounce between the two endpoints forever.
  if (response.status === 401 && auth && !retrying && tokens.refresh()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, retrying: true });
    }
  }

  if (!response.ok) {
    throw await toError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokens.refresh();
  if (!refreshToken) {
    return false;
  }
  try {
    const auth = await request<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
    tokens.save(auth);
    return true;
  } catch {
    // The refresh token is spent, revoked, or the account was disabled from
    // the admin console: either way the session is over.
    tokens.clear();
    return false;
  }
}

/** Builds a query string, leaving out anything the caller did not set. */
function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

/* --------------------------------------------------------------------- api */

export const api = {
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  async logout() {
    const refreshToken = tokens.refresh();
    if (refreshToken) {
      // Best effort: the local session is gone either way.
      await request<void>("/api/auth/logout", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      }).catch(() => undefined);
    }
    tokens.clear();
  },

  me: () => request<MeResponse>("/api/me"),

  plans: () => request<PlanOption[]>("/api/billing/plans", { auth: false }),

  subscribe: (plan: Plan) =>
    request<SubscriptionResponse>("/api/billing/subscribe", {
      method: "POST",
      body: { plan },
    }),

  cancelSubscription: () =>
    request<SubscriptionResponse>("/api/billing/cancel", { method: "POST" }),

  /** The file goes to the server as-is; the server does the parsing. */
  uploadResume(file: File, label?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (label) {
      formData.append("label", label);
    }
    return request<BaseResumeDetail>("/api/resumes", { method: "POST", formData });
  },

  listResumes: () => request<BaseResumeSummary[]>("/api/resumes"),

  getResume: (id: number) => request<BaseResumeDetail>(`/api/resumes/${id}`),

  deleteResume: (id: number) =>
    request<void>(`/api/resumes/${id}`, { method: "DELETE" }),

  tailor: (input: { baseResumeId?: number; resumeText?: string; jobDescription: string }) =>
    request<TailoredResumeDetail>("/api/tailorings", { method: "POST", body: input }),

  listTailorings: () => request<TailoredResumeSummary[]>("/api/tailorings"),

  getTailoring: (id: number) => request<TailoredResumeDetail>(`/api/tailorings/${id}`),

  /** Deleting a tailoring frees the quota slot it was holding -- usage is a
   *  count of rows in the period, not a counter that only goes up. */
  deleteTailoring: (id: number) =>
    request<void>(`/api/tailorings/${id}`, { method: "DELETE" }),

  /**
   * Downloads the generated file.
   *
   * Fetched rather than linked because the endpoint needs an Authorization
   * header, which a plain anchor cannot send.
   */
  async download(id: number, format: "pdf" | "docx") {
    const token = tokens.access();
    const response = await fetch(
      `${BASE_URL}/api/tailorings/${id}/download?format=${format}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) {
      throw await toError(response);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? `resume.${format}`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  /* ------------------------------------------------------------- admin */

  admin: {
    overview: () => request<AdminOverview>("/api/admin/overview"),

    activity: () => request<AdminActivityEntry[]>("/api/admin/activity"),

    users: (filters: AdminUserFilters = {}) =>
      request<AdminUserPage>(
        `/api/admin/users${queryString({
          query: filters.query,
          active: filters.active,
          role: filters.role,
          page: filters.page,
          size: filters.size,
        })}`,
      ),

    user: (id: number) => request<AdminUserDetail>(`/api/admin/users/${id}`),

    createUser: (input: {
      name: string;
      email: string;
      password: string;
      role?: Role;
      plan?: Plan;
    }) => request<AdminUserDetail>("/api/admin/users", { method: "POST", body: input }),

    /**
     * Enabling or disabling an account.
     *
     * <p>Disabling takes effect on that user's very next request, not when
     * their token happens to expire -- the server re-reads the account on
     * every call.
     */
    setActive: (id: number, active: boolean) =>
      request<AdminUserDetail>(`/api/admin/users/${id}/active`, {
        method: "PATCH",
        body: { active },
      }),

    setRole: (id: number, role: Role) =>
      request<AdminUserDetail>(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: { role },
      }),

    setPlan: (id: number, plan: Plan) =>
      request<AdminUserDetail>(`/api/admin/users/${id}/plan`, {
        method: "PATCH",
        body: { plan },
      }),

    /**
     * Gives one account a different monthly allowance from the rest of its plan.
     *
     * <p>Separate from setPlan because changing plan resets the allowance to
     * that plan's default -- doing both in one call would mean one silently
     * undoes the other.
     */
    setAllowance: (id: number, monthlyTailorings: number) =>
      request<AdminUserDetail>(`/api/admin/users/${id}/allowance`, {
        method: "PATCH",
        body: { monthlyTailorings },
      }),
  },
};
