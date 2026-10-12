"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  FileText,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { StatCard } from "@/components/ui/Metrics";
import { Reveal } from "@/components/ui/Reveal";
import { api, errorMessage, type AdminOverview } from "@/lib/api";
import { initials, relativeTime, scoreTone } from "@/lib/utils";

/**
 * What is happening on this installation.
 *
 * <p>The counts and the feed come from one endpoint, so the numbers at the top
 * and the events below them are always from the same instant. Two calls would
 * let the page show four users and a feed with five signups in it, which reads
 * as a bug even when both halves are individually correct.
 */
export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // Bumped by the Refresh button. Keeping it in the effect's dependencies
  // means there is exactly one place that fetches, rather than a loader
  // function called from both a handler and an effect.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await api.admin.overview();
        if (cancelled) {
          return;
        }
        setOverview(loaded);
        setError("");
      } catch (caught) {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load the overview."));
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = () => {
    setRefreshing(true);
    setReloadToken((token) => token + 1);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Overview"
        description="Accounts, usage and recent activity across this installation."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={reload}
              loading={refreshing}
              icon={!refreshing && <RefreshCw className="size-4" />}
            >
              Refresh
            </Button>
            <ButtonLink
              href="/admin/users"
              size="sm"
              icon={<UserPlus className="size-4" />}
            >
              Manage users
            </ButtonLink>
          </div>
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {!overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Accounts"
              value={overview.totalUsers}
              hint={`${overview.newUsersLast7Days} new in the last 7 days`}
              icon={<Users className="size-4" />}
            />
            <StatCard
              label="Active"
              value={overview.activeUsers}
              hint={
                overview.disabledUsers > 0
                  ? `${overview.disabledUsers} disabled`
                  : "none disabled"
              }
              icon={<ShieldCheck className="size-4" />}
              tone={overview.disabledUsers > 0 ? "warn" : "brand"}
            />
            <StatCard
              label="Resumes tailored"
              value={overview.totalTailorings}
              hint={`${overview.tailoringsLast7Days} in the last 7 days`}
              icon={<Wand2 className="size-4" />}
            />
            <StatCard
              label="Average match"
              value={
                overview.averageMatchScore === null
                  ? "—"
                  : `${overview.averageMatchScore}%`
              }
              hint={
                overview.averageMatchScore === null
                  ? "nothing tailored yet"
                  : "across every rewrite"
              }
              icon={<Gauge className="size-4" />}
              tone="brand"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Free plan"
              value={overview.freePlans}
              icon={<Sparkles className="size-4" />}
            />
            <StatCard
              label="Pro plan"
              value={overview.proPlans}
              icon={<Sparkles className="size-4" />}
              tone="brand"
            />
            <StatCard
              label="Base resumes stored"
              value={overview.totalResumes}
              icon={<FileText className="size-4" />}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            {/* The feed. */}
            <Reveal>
              <Card className="h-full">
                <CardHeader
                  title="Recent activity"
                  description="Signups and tailorings, newest first."
                  icon={<Activity className="size-[1.125rem]" />}
                />
                <CardBody>
                  {overview.recentActivity.length === 0 ? (
                    <EmptyState
                      icon={<Activity className="size-5" />}
                      title="Nothing has happened yet"
                      description="Activity appears here as soon as somebody signs up or tailors a resume."
                    />
                  ) : (
                    <ul className="space-y-1">
                      {overview.recentActivity.map((entry, index) => {
                        const isTailoring = entry.type === "TAILORING";
                        const tone =
                          entry.matchScore !== null ? scoreTone(entry.matchScore) : null;

                        return (
                          <li key={`${entry.type}-${entry.userId}-${index}`}>
                            <Link
                              href={`/admin/users/${entry.userId}`}
                              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
                            >
                              <span
                                className={
                                  isTailoring
                                    ? "flex size-8 shrink-0 items-center justify-center rounded-lg border border-brand-line bg-brand-soft text-brand"
                                    : "flex size-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--violet)]/30 bg-[color:var(--violet)]/10 text-violet"
                                }
                              >
                                {isTailoring ? (
                                  <Wand2 className="size-3.5" aria-hidden />
                                ) : (
                                  <UserPlus className="size-3.5" aria-hidden />
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-ink">
                                  <span className="font-medium">{entry.userName}</span>
                                  <span className="text-ink-muted">
                                    {" "}
                                    {isTailoring ? "tailored" : ""} {entry.detail}
                                  </span>
                                </p>
                                <p className="truncate text-xs text-ink-faint">
                                  {entry.userEmail}
                                </p>
                              </div>

                              {tone && (
                                <span
                                  className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[0.6875rem] tabular-nums"
                                  style={{ background: tone.tint, color: tone.color }}
                                >
                                  {entry.matchScore}%
                                </span>
                              )}
                              <span className="w-20 shrink-0 text-right text-xs text-ink-faint">
                                {relativeTime(entry.at)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </Reveal>

            {/* Newest accounts. */}
            <Reveal delay={0.08}>
              <Card className="h-full">
                <CardHeader
                  title="Newest accounts"
                  description="The most recent signups."
                  icon={<UserPlus className="size-[1.125rem]" />}
                  action={
                    <Link
                      href="/admin/users"
                      className="text-[0.8125rem] font-medium text-brand underline-offset-4 hover:underline"
                    >
                      All users
                    </Link>
                  }
                />
                <CardBody>
                  {overview.recentSignups.length === 0 ? (
                    <EmptyState
                      icon={<Users className="size-5" />}
                      title="No accounts yet"
                      description="The first person to sign up appears here."
                    />
                  ) : (
                    <ul className="space-y-1">
                      {overview.recentSignups.map((user) => (
                        <li key={user.id}>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-[0.6875rem] font-bold text-ink-muted">
                              {initials(user.name, user.email)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-ink">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-ink-faint">
                                {relativeTime(user.createdAt)}
                              </p>
                            </div>
                            {!user.active && <Badge tone="danger">Disabled</Badge>}
                            {user.role === "ADMIN" && <Badge tone="violet">Admin</Badge>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}
