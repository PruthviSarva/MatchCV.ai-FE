"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, History, Search, Trash2, Wand2 } from "lucide-react";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Card, CardBody, SectionHeading } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth";
import { api, errorMessage, type TailoredResumeSummary } from "@/lib/api";
import { formatDate, relativeTime, scoreTone } from "@/lib/utils";

/**
 * Every tailoring, newest first.
 *
 * <p>Filtering happens in the browser. The endpoint returns one user's own
 * history, which is tens of rows rather than thousands, so a search parameter
 * and a round trip per keystroke would be slower than a substring match and
 * add an endpoint to maintain for no benefit.
 */
export default function HistoryPage() {
  const { refresh } = useAuth();
  const [entries, setEntries] = useState<TailoredResumeSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TailoredResumeSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .listTailorings()
      .then(setEntries)
      .catch((caught) => {
        setError(errorMessage(caught, "Could not load your history."));
        setEntries([]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!entries) {
      return [];
    }
    const term = query.trim().toLowerCase();
    if (!term) {
      return entries;
    }
    return entries.filter((entry) => entry.jobTitle.toLowerCase().includes(term));
  }, [entries, query]);

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteTailoring(pendingDelete.id);
      setEntries((current) =>
        (current ?? []).filter((entry) => entry.id !== pendingDelete.id),
      );
      // Usage is a count of rows in the period, so deleting one genuinely
      // hands the slot back. The sidebar meter has to be told.
      await refresh();
      toast.success("Deleted. That rewrite is back in your allowance.");
      setPendingDelete(null);
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not delete that rewrite."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        title="History"
        description="Every resume you have tailored, with the posting it was built for."
        action={
          <ButtonLink href="/app/tailor" icon={<Wand2 className="size-4" />}>
            Tailor a resume
          </ButtonLink>
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {entries === null ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-[4.5rem] rounded-2xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<History className="size-5" />}
          title="Nothing here yet"
          description="Tailored resumes are kept with their posting and match score, so you can come back to any of them."
          action={
            <ButtonLink href="/app/tailor" size="sm">
              Tailor your first resume
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by job title"
            icon={<Search className="size-4" aria-hidden />}
            wrapperClassName="max-w-sm"
            aria-label="Search history"
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="No match"
              description={`Nothing in your history matches "${query}".`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                  Clear the search
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {filtered.map((entry) => {
                const tone = scoreTone(entry.matchScore);
                return (
                  <li key={entry.id}>
                    <Card interactive className="group">
                      <CardBody className="flex items-center gap-4 p-4">
                        <span
                          className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-semibold tabular-nums"
                          style={{ background: tone.tint, color: tone.color }}
                        >
                          {entry.matchScore}
                          <span className="text-[0.5rem] font-medium opacity-70">
                            MATCH
                          </span>
                        </span>

                        <Link
                          href={`/app/history/${entry.id}`}
                          className="min-w-0 flex-1 outline-none"
                        >
                          <p className="truncate text-[0.9375rem] font-medium text-ink">
                            {entry.jobTitle}
                          </p>
                          <p className="mt-0.5 text-[0.8125rem] text-ink-faint">
                            <span style={{ color: tone.color }}>{tone.label}</span>{" "}
                            &middot; {formatDate(entry.createdAt)} &middot;{" "}
                            {relativeTime(entry.createdAt)}
                          </p>
                        </Link>

                        <div className="flex shrink-0 items-center gap-1">
                          <IconButton
                            label="Delete this rewrite"
                            size="sm"
                            onClick={() => setPendingDelete(entry)}
                            className="text-ink-faint hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </IconButton>
                          <Link
                            href={`/app/history/${entry.id}`}
                            aria-label={`Open ${entry.jobTitle}`}
                            className="flex size-8 items-center justify-center rounded-lg text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                          >
                            <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this rewrite?"
        description="The tailored resume and its notes are removed. Your original uploaded resume is untouched."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{pendingDelete?.jobTitle}</span> will
          be deleted. The rewrite it used goes back into this period&apos;s allowance.
        </p>
      </Modal>
    </div>
  );
}
