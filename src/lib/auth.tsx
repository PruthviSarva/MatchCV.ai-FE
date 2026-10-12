"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api, tokens, type MeResponse } from "@/lib/api";

/**
 * Who is signed in, and what they are allowed to do right now.
 *
 * <p>`/api/me` is the single source of truth. It returns the account and the
 * live subscription together, so no screen can show an allowance that a token
 * minted ten minutes ago happened to encode -- and no screen keeps offering
 * the admin navigation to somebody whose role was taken away while they were
 * looking at it.
 *
 * <p>Nothing here is a security boundary. The server re-reads the account on
 * every single request; this context exists so the interface tells the truth,
 * not so that it enforces anything.
 */

type Status = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: Status;
  me: MeResponse | null;
  /** The role check that the navigation and the admin guard both make. */
  isAdmin: boolean;
  /** Set when the session could not be loaded for a reason worth showing. */
  error: string;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * How a failed `/api/me` should be reported.
 *
 * <p>401 and 403 both mean the stored session is over -- expired, revoked, or
 * the account was disabled from the admin console -- so both clear the tokens.
 * Only the disabled case gets a message, because "your session ended" is
 * noise next to a login screen, while "your account was disabled" is the one
 * thing somebody in that position actually needs to be told.
 */
function describeFailure(caught: unknown): { sessionOver: boolean; message: string } {
  if (caught instanceof ApiError && (caught.status === 401 || caught.status === 403)) {
    return {
      sessionOver: true,
      message:
        caught.status === 403
          ? "This account has been disabled. Contact an administrator."
          : "",
    };
  }
  return {
    sessionOver: false,
    message:
      caught instanceof ApiError ? caught.message : "Could not load your account.",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");

  /**
   * Re-reads the session.
   *
   * <p>Called after anything that changes what the server would say -- a
   * tailoring spending part of the allowance, a plan change, a role change --
   * never from an effect body. The mount path below is deliberately separate
   * so that no state is written synchronously while the tree is rendering.
   */
  const refresh = useCallback(async () => {
    if (!tokens.access()) {
      setMe(null);
      setStatus("anonymous");
      return;
    }
    try {
      setMe(await api.me());
      setStatus("authenticated");
      setError("");
    } catch (caught) {
      const { sessionOver, message } = describeFailure(caught);
      if (sessionOver) {
        tokens.clear();
        setMe(null);
      }
      setStatus("anonymous");
      setError(message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Written as a promise chain rather than as a call to refresh() so that
    // every state update happens in a callback, after the effect has returned.
    // The no-token case resolves to null instead of branching here, which is
    // what keeps it off the synchronous path too.
    Promise.resolve()
      .then(() => (tokens.access() ? api.me() : null))
      .then((loaded) => {
        if (cancelled) {
          return;
        }
        setMe(loaded);
        setStatus(loaded ? "authenticated" : "anonymous");
        setError("");
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        const { sessionOver, message } = describeFailure(caught);
        if (sessionOver) {
          tokens.clear();
        }
        setMe(null);
        setStatus("anonymous");
        setError(message);
      });

    return () => {
      // Stops a response that arrives after an unmount from writing state.
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      tokens.save(await api.login(email, password));
      await refresh();
    },
    [refresh],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      tokens.save(await api.signup(name, email, password));
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await api.logout();
    setMe(null);
    setError("");
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      me,
      isAdmin: me?.user.role === "ADMIN",
      error,
      refresh,
      signIn,
      signUp,
      signOut,
    }),
    [status, me, error, refresh, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
