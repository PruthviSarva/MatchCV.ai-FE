"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Gauge,
  History,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Field";
import { Meter, StatCard } from "@/components/ui/Metrics";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth";
import {
  api,
  errorMessage,
  type AdminUserDetail,
  type Plan,
  type Role,
} from "@/lib/api";
import {
  compactNumber,
  formatDate,
  formatDateTime,
  initials,
  relativeTime,
  scoreTone,
} from "@/lib/utils";

/**
 * One account, in full: who they are, what plan they are on, what they have
 * uploaded and what they have tailored.
 *
 * <p>The tailorings are listed by job title and score only. An administrator
 * has a legitimate reason to see that an account is being used and how heavily
 * -- that is what the console is for -- and no reason at all to read the
 * contents of somebody's resume. The API does not expose it here either, so
 * this is a boundary rather than a decision the page is making on its own.
 */
export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const { me, refresh } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const userId = Number(params.id);
  const validId = Number.isFinite(userId);

  useEffect(() => {
    if (!validId) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const loaded = await api.admin.user(userId);
        if (!cancelled) {
          setDetail(loaded);
        }
      } catch (caught) {
        if (!cancelled) {
          setLoadError(errorMessage(caught, "Could not load that account."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, validId]);

  // A malformed id is knowable from the URL alone, so it is derived rather
  // than stored -- there is nothing to fetch and nothing to wait for.
  const error = validId ? loadError : "That is not a valid account id.";

  /** Every mutation returns the refreshed detail, so one handler covers them all. */
  const apply = async (
    action: () => Promise<AdminUserDetail>,
    successMessage: string,
  ) => {
    setWorking(true);
    try {
      setDetail(await action());
      toast.success(successMessage);
      setConfirmDisable(false);
      if (userId === me?.user.id) {
        await refresh();
      }
    } catch (caught) {
      toast.error(errorMessage(caught, "That change was refused."));
    } finally {
      setWorking(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-5">
        <BackLink />
        <ErrorNote>{error}</ErrorNote>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { user, subscription, resumes, tailorings } = detail;
  const isSelf = user.id === me?.user.id;

  return (
    <div className="space-y-6">
      <BackLink />

      <SectionHeading
        title={user.name}
        description={user.email}
        action={
          user.active ? (
            <Button
              variant="danger"
              disabled={working || isSelf}
              title={isSelf ? "You cannot disable your own account" : undefined}
              onClick={() => setConfirmDisable(true)}
              icon={<UserX className="size-4" />}
            >
              Disable account
            </Button>
          ) : (
            <Button
              disabled={working}
              onClick={() =>
                apply(() => api.admin.setActive(user.id, true), `${user.name} re-enabled`)
              }
              icon={<UserCheck className="size-4" />}
            >
              Enable account
            </Button>
          )
        }
      />

      {/* Identity and the levers. */}
      <Card>
        <CardBody className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-3 text-lg font-bold text-ink-muted">
              {initials(user.name, user.email)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={user.active ? "brand" : "danger"} dot>
                  {user.active ? "Active" : "Disabled"}
                </Badge>
                {user.role === "ADMIN" && (
                  <Badge tone="violet" icon={<Shield className="size-3" />}>
                    Administrator
                  </Badge>
                )}
                {isSelf && <Badge>This is you</Badge>}
              </div>
              <p className="mt-2 text-[0.8125rem] text-ink-muted">
                Joined {formatDate(user.createdAt)} &middot; last signed in{" "}
                {user.lastLoginAt ? relativeTime(user.lastLoginAt) : "never"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <Select
              label="Role"
              value={user.role}
              disabled={working || isSelf}
              hint={isSelf ? "You cannot change your own role" : undefined}
              onChange={(event) =>
                apply(
                  () => api.admin.setRole(user.id, event.target.value as Role),
                  "Role updated",
                )
              }
            >
              <option value="USER">User</option>
              <option value="ADMIN">Administrator</option>
            </Select>

            <Select
              label="Plan"
              value={subscription.plan}
              disabled={working}
              hint="Takes effect immediately"
              onChange={(event) =>
                apply(
                  () => api.admin.setPlan(user.id, event.target.value as Plan),
                  "Plan updated",
                )
              }
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro</option>
            </Select>
          </div>

          <AllowanceControl
            current={subscription.monthlyTailorings}
            working={working}
            onSave={(allowance) =>
              apply(
                () => api.admin.setAllowance(user.id, allowance),
                `Allowance set to ${allowance} a period`,
              )
            }
          />

          {/*
            Stated here because it is the one consequence of a plan change that
            is not obvious from the dropdown: moving between plans restarts the
            billing period, which hands back a full allowance -- and discards
            any override set just above.
          */}
          <p className="text-[0.8125rem] leading-relaxed text-ink-faint">
            Changing the plan restarts this account&apos;s billing period and
            resets its allowance to that plan&apos;s default. Setting the plan
            it already has does nothing.
          </p>
        </CardBody>
      </Card>

      {/* Usage. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Rewrites used"
          value={subscription.used}
          hint={`of ${subscription.monthlyTailorings} this period`}
          icon={<History className="size-4" />}
        />
        <StatCard
          label="Base resumes"
          value={resumes.length}
          hint="stored as extracted text"
          icon={<FileText className="size-4" />}
        />
        <StatCard
          label="Rewrites all time"
          value={tailorings.length}
          hint="across every period"
          icon={<CreditCard className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader
          title="This period"
          description={`${formatDate(subscription.periodStart)} to ${formatDate(subscription.periodEnd)}`}
          icon={<CreditCard className="size-[1.125rem]" />}
        />
        <CardBody>
          <Meter
            value={subscription.used}
            max={subscription.monthlyTailorings}
            tone={
              subscription.remaining === 0
                ? "danger"
                : subscription.remaining <= 1
                  ? "warn"
                  : "brand"
            }
          />
          <p className="mt-2.5 text-[0.8125rem] text-ink-muted">
            {subscription.remaining} of {subscription.monthlyTailorings} remaining.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Their resumes -- metadata only. */}
        <Card>
          <CardHeader
            title="Uploaded resumes"
            description="Names and sizes only. The console does not show their contents."
            icon={<FileText className="size-[1.125rem]" />}
          />
          <CardBody>
            {resumes.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-5" />}
                title="Nothing uploaded"
                description="This account has not added a resume yet."
              />
            ) : (
              <ul className="space-y-2">
                {resumes.map((resume) => (
                  <li
                    key={resume.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-faint">
                      <FileText className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {resume.label}
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        {compactNumber(resume.characterCount)} characters &middot;{" "}
                        {formatDate(resume.createdAt)}
                      </p>
                    </div>
                    <Badge>{resume.sourceType}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Their tailorings. */}
        <Card>
          <CardHeader
            title="Tailoring history"
            description="What this account has applied for, and how well it matched."
            icon={<History className="size-[1.125rem]" />}
          />
          <CardBody>
            {tailorings.length === 0 ? (
              <EmptyState
                icon={<History className="size-5" />}
                title="Nothing tailored"
                description="This account has not run a rewrite yet."
              />
            ) : (
              <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {tailorings.map((entry) => {
                  const tone = scoreTone(entry.matchScore);
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums"
                        style={{ background: tone.tint, color: tone.color }}
                      >
                        {entry.matchScore}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {entry.jobTitle}
                        </p>
                        <p className="truncate text-xs text-ink-faint">
                          {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        title="Disable this account?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDisable(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={working}
              onClick={() =>
                apply(
                  () => api.admin.setActive(user.id, false),
                  `${user.name} disabled`,
                )
              }
            >
              Disable account
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{user.name}</span> is signed out
          immediately and cannot log back in. Their resumes and history are kept,
          and enabling the account again restores access exactly as it was.
        </p>
      </Modal>
    </div>
  );
}

/**
 * Raises or lowers one account's monthly allowance.
 *
 * <p>Kept as a draft with an explicit Save rather than saving on every
 * keystroke: a number field passes through "3", "30" and "300" on the way to
 * "300", and firing a request at each of those would briefly set an allowance
 * nobody asked for.
 *
 * <p>The same number is the {@code monthly_tailorings} column on the
 * subscriptions row, so it can equally be changed with SQL when that is
 * quicker.
 */
function AllowanceControl({
  current,
  working,
  onSave,
}: {
  current: number;
  working: boolean;
  onSave: (allowance: number) => void;
}) {
  const [draft, setDraft] = useState(String(current));

  // The committed value is the authority: after a save, or after a plan change
  // reset it, the field must show what the server now holds rather than
  // whatever was last typed.
  const [lastSeen, setLastSeen] = useState(current);
  if (lastSeen !== current) {
    setLastSeen(current);
    setDraft(String(current));
  }

  const parsed = Number(draft);
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 10_000;
  const changed = parsed !== current;

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      {/*
        The field is sized by a wrapper rather than by a class on the field
        itself: every control in this app is 100% of its container, so the
        container is the thing to size. The button is inline-flex and keeps
        its natural width.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <Input
            type="number"
            min={0}
            max={10000}
            label="Rewrites per period"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            error={valid ? undefined : "Enter a whole number between 0 and 10,000"}
          />
        </div>
        <Button
          size="md"
          disabled={!valid || !changed || working}
          onClick={() => onSave(parsed)}
          icon={<Gauge className="size-4" />}
        >
          Save allowance
        </Button>
      </div>
      <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-faint">
        Overrides the plan default for this account only, and takes effect on
        their next request. The period is not restarted, so rewrites already
        used this period stay used.
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/users"
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to users
    </Link>
  );
}
