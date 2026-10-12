"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TailorResult } from "@/components/app/TailorResult";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { api, errorMessage, type TailoredResumeDetail } from "@/lib/api";

/**
 * One tailoring from the history, rendered by the same component that shows a
 * fresh result.
 *
 * <p>Sharing that component is the point: a rewrite opened a week later must
 * look identical to the one that was just produced, including which download
 * button is the primary one. Two renderers for the same object drift, and the
 * drift always shows up as "the old ones look wrong".
 *
 * <p>The id comes from `useParams` rather than the page's `params` prop
 * because this is a client component -- in this version of Next the prop is a
 * promise, and the hook is the supported way to read it from the browser.
 */
export default function TailoringDetailPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<TailoredResumeDetail | null>(null);
  const [loadError, setLoadError] = useState("");

  const id = Number(params.id);
  const validId = Number.isFinite(id);

  useEffect(() => {
    if (!validId) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const loaded = await api.getTailoring(id);
        if (!cancelled) {
          setResult(loaded);
        }
      } catch (caught) {
        if (!cancelled) {
          setLoadError(errorMessage(caught, "Could not load that rewrite."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  // A malformed id is known from the URL alone, so it is derived rather than
  // stored -- there is nothing to fetch and nothing to wait for.
  const error = validId ? loadError : "That is not a valid rewrite id.";

  return (
    <div className="space-y-5">
      <Link
        href="/app/history"
        className="no-print inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to history
      </Link>

      {error ? (
        <>
          <ErrorNote>{error}</ErrorNote>
          <EmptyState
            title="This rewrite is not available"
            description="It may have been deleted, or it belongs to another account."
            action={
              <ButtonLink href="/app/history" size="sm" variant="secondary">
                Back to history
              </ButtonLink>
            }
          />
        </>
      ) : result ? (
        <TailorResult result={result} />
      ) : (
        <div className="space-y-5">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}
    </div>
  );
}
