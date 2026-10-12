"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  FileText,
  History,
  Sparkles,
  TrendingUp,
  Upload,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Meter, StatCard } from "@/components/ui/Metrics";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/lib/auth";
import {
  api,
  errorMessage,
  type BaseResumeSummary,
  type TailoredResumeSummary,
} from "@/lib/api";
import { formatDate, relativeTime, scoreTone } from "@/lib/utils";

/**
 * The first screen after signing in.
 *
 * <p>Answers three questions in order: where do I stand this period, what did
 * I do recently, and what do I do next. The primary action is always visible
 * -- a dashboard that only reports is a dead end.
 */
export default function DashboardPage() {
  const { me } = useAuth();
  const [resumes, setResumes] = useState<BaseResumeSummary[] | null>(null);
  const [history, setHistory] = useState<TailoredResumeSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listResumes(), api.listTailorings()])
      .then(([loadedResumes, loadedHistory]) => {
        if (cancelled) {
          return;
        }
        setResumes(loadedResumes);
        setHistory(loadedHistory);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load your account."));
          // Empty rather than left null, so the page settles into its real
          // layout instead of showing skeletons that will never resolve.
          setResumes([]);
          setHistory([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me) {
    return null;
  }

  const { subscription, user } = me;
  const loading = resumes === null || history === null;
  const bestScore = history?.length
    ? Math.max(...history.map((entry) => entry.matchScore))
    : null;
  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div className="space-y-7">
      <SectionHeading
        title={`Welcome back, ${firstName}`}
        description="Pick a saved resume, paste a posting, and get a rewrite built for that role."
        action={
          <ButtonLink href="/app/tailor" icon={<Wand2 className="size-4" />}>
            Tailor a resume
          </ButtonLink>
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {/* The numbers. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rewrites left"
          value={
            loading ? <Skeleton className="h-7 w-10" /> : subscription.remaining
          }
          hint={`of ${subscription.monthlyTailorings} this period`}
          icon={<Sparkles className="size-4" />}
          tone={subscription.remaining === 0 ? "danger" : "brand"}
        />
        <StatCard
          label="Resumes tailored"
          value={loading ? <Skeleton className="h-7 w-10" /> : history.length}
          hint="all time"
          icon={<History className="size-4" />}
        />
        <StatCard
          label="Base resumes"
          value={loading ? <Skeleton className="h-7 w-10" /> : resumes.length}
          hint={resumes?.length ? "ready to tailor from" : "none uploaded yet"}
          icon={<FileText className="size-4" />}
        />
        <StatCard
          label="Best match"
          value={
            loading ? (
              <Skeleton className="h-7 w-14" />
            ) : bestScore === null ? (
              "—"
            ) : (
              `${bestScore}%`
            )
          }
          hint={bestScore === null ? "no rewrites yet" : "your strongest fit so far"}
          icon={<TrendingUp className="size-4" />}
          tone="brand"
        />
      </div>

      {/* The allowance, spelled out rather than only shown in the sidebar. */}
      <Reveal>
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[0.9375rem] font-semibold text-ink">
                  {subscription.plan === "PRO" ? "Pro plan" : "Free plan"}
                </h2>
                <Badge tone={subscription.status === "ACTIVE" ? "brand" : "warn"} dot>
                  {subscription.status === "ACTIVE" ? "Active" : "Ending"}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-ink-muted">
                {subscription.used} of {subscription.monthlyTailorings} used. Resets{" "}
                {formatDate(subscription.periodEnd)}.
              </p>
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
                className="mt-3 max-w-xs"
              />
            </div>
            <ButtonLink href="/app/billing" variant="secondary" size="sm">
              Plan and usage
            </ButtonLink>
          </CardBody>
        </Card>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent rewrites. */}
        <Reveal>
          <Card className="h-full">
            <CardHeader
              title="Recent rewrites"
              description="Every tailoring stays here with its posting and score."
              icon={<History className="size-[1.125rem]" />}
              action={
                history && history.length > 0 ? (
                  <Link
                    href="/app/history"
                    className="text-[0.8125rem] font-medium text-brand underline-offset-4 hover:underline"
                  >
                    View all
                  </Link>
                ) : null
              }
            />
            <CardBody>
              {loading ? (
                <div className="space-y-2.5">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={<Wand2 className="size-5" />}
                  title="No rewrites yet"
                  description="Upload a resume and paste a posting to see your first tailored version."
                  action={
                    <ButtonLink href="/app/tailor" size="sm">
                      Tailor a resume
                    </ButtonLink>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {history.slice(0, 5).map((entry) => (
                    <li key={entry.id}>
                      <HistoryRow entry={entry} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Reveal>

        {/* Saved resumes. */}
        <Reveal delay={0.08}>
          <Card className="h-full">
            <CardHeader
              title="Your resumes"
              description="Tailor from any of these."
              icon={<FileText className="size-[1.125rem]" />}
              action={
                <Link
                  href="/app/resumes"
                  className="text-[0.8125rem] font-medium text-brand underline-offset-4 hover:underline"
                >
                  Manage
                </Link>
              }
            />
            <CardBody>
              {loading ? (
                <div className="space-y-2.5">
                  {[0, 1].map((index) => (
                    <Skeleton key={index} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : resumes.length === 0 ? (
                <EmptyState
                  icon={<Upload className="size-5" />}
                  title="Nothing uploaded"
                  description="PDF, DOCX or plain text. It is parsed on the server."
                  action={
                    <ButtonLink href="/app/resumes" size="sm" variant="secondary">
                      Upload a resume
                    </ButtonLink>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {resumes.slice(0, 4).map((resume) => (
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
                          {resume.sourceType.toUpperCase()} &middot; added{" "}
                          {relativeTime(resume.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

/** One row of history. Shared shape with the history screen's list. */
function HistoryRow({ entry }: { entry: TailoredResumeSummary }) {
  const tone = scoreTone(entry.matchScore);

  return (
    <Link
      href={`/app/history/${entry.id}`}
      className="group flex items-center gap-3.5 rounded-xl border border-line bg-surface-2 px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-3"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums"
        style={{ background: tone.tint, color: tone.color }}
      >
        {entry.matchScore}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{entry.jobTitle}</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          <span style={{ color: tone.color }}>{tone.label}</span> &middot;{" "}
          {relativeTime(entry.createdAt)}
        </p>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
        aria-hidden
      />
    </Link>
  );
}

