"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Sparkles, Wand2 } from "lucide-react";
import { ResumeChooser, ResumeDropzone } from "@/components/app/ResumePicker";
import { TailorResult } from "@/components/app/TailorResult";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Textarea } from "@/components/ui/Field";
import { useAuth } from "@/lib/auth";
import {
  ApiError,
  api,
  errorMessage,
  type BaseResumeSummary,
  type TailoredResumeDetail,
} from "@/lib/api";
import { cn, wordCount } from "@/lib/utils";

/** The backend rejects anything shorter, so say so before the round trip. */
const MIN_DESCRIPTION = 50;

/**
 * The main flow: pick a resume, paste a posting, get a rewrite.
 *
 * <p>Laid out as two numbered steps on one screen rather than as a wizard with
 * a Next button. Both inputs fit comfortably together, and the person doing
 * this is usually pasting from a tab they still have open -- being able to see
 * the resume they chose while pasting is worth more than the tidiness of one
 * question at a time.
 */
export default function TailorPage() {
  const { me, refresh } = useAuth();
  const [resumes, setResumes] = useState<BaseResumeSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<TailoredResumeDetail | null>(null);
  const [error, setError] = useState("");
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  /** Re-reads the list after an upload. Not used by the mount effect below. */
  const loadResumes = useCallback(async () => {
    const saved = await api.listResumes();
    setResumes(saved);
    // Preselect the newest, so the common case is one paste and one click.
    setSelectedId((current) => current ?? saved[0]?.id ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await api.listResumes();
        if (cancelled) {
          return;
        }
        setResumes(saved);
        setSelectedId((current) => current ?? saved[0]?.id ?? null);
      } catch (caught) {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load your saved resumes."));
          setResumes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const saved = await api.uploadResume(file);
      await loadResumes();
      setSelectedId(saved.id);
      toast.success(`${saved.label} is ready to tailor from`);
    } catch (caught) {
      setError(errorMessage(caught, "That file could not be read."));
    } finally {
      setUploading(false);
    }
  };

  const tooShort = jobDescription.trim().length < MIN_DESCRIPTION;
  const canSubmit = selectedId !== null && !tooShort && !tailoring;

  const tailor = async () => {
    if (!canSubmit || selectedId === null) {
      return;
    }
    setTailoring(true);
    setError("");
    setQuotaExhausted(false);
    setResult(null);

    try {
      const tailored = await api.tailor({
        baseResumeId: selectedId,
        jobDescription,
      });
      setResult(tailored);
      // The allowance just moved; the sidebar must not show a stale number.
      await refresh();
      toast.success(`Tailored for ${tailored.jobTitle}`);
      // Scroll after paint, or the target is still zero-height.
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (caught) {
      setError(errorMessage(caught, "The rewrite failed."));
      setQuotaExhausted(caught instanceof ApiError && caught.isQuotaExhausted);
    } finally {
      setTailoring(false);
    }
  };

  const outOfQuota = me ? me.subscription.remaining <= 0 : false;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Tailor a resume"
        description="Pick the resume to start from, paste the posting, and MatchCV.ai rewrites it for that role."
      />

      {outOfQuota && !result && (
        <ErrorNote
          action={
            <ButtonLink href="/app/billing" size="sm" variant="danger">
              See plans
            </ButtonLink>
          }
        >
          You have used all {me?.subscription.monthlyTailorings} rewrites for this
          period. The allowance resets automatically.
        </ErrorNote>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Step one. */}
        <Card>
          <CardHeader
            title={<StepTitle index={1} done={selectedId !== null} label="Your resume" />}
            description="Tailoring starts from one of your saved resumes."
          />
          <CardBody className="space-y-4">
            {resumes === null ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : (
              <>
                <ResumeChooser
                  resumes={resumes}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                <ResumeDropzone
                  onFile={upload}
                  uploading={uploading}
                  compact={resumes.length > 0}
                />
              </>
            )}
          </CardBody>
        </Card>

        {/* Step two. */}
        <Card>
          <CardHeader
            title={<StepTitle index={2} done={!tooShort} label="The job description" />}
            description="Paste the whole posting. The more of it there is, the more there is to match against."
          />
          <CardBody>
            <Textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the full posting here, including the responsibilities and the requirements."
              className="h-64"
              hint={
                <span className={cn(tooShort && jobDescription.length > 0 && "text-warn")}>
                  {wordCount(jobDescription)} words
                </span>
              }
              aria-label="Job description"
            />
            <p className="mt-2 text-xs text-ink-faint">
              {tooShort && jobDescription.length > 0
                ? `A little more, please — at least ${MIN_DESCRIPTION} characters.`
                : "Nothing you paste here is used to train anything."}
            </p>
          </CardBody>
        </Card>
      </div>

      {error && (
        <ErrorNote
          action={
            quotaExhausted ? (
              <ButtonLink href="/app/billing" size="sm" variant="danger">
                See plans
              </ButtonLink>
            ) : null
          }
        >
          {error}
        </ErrorNote>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          onClick={tailor}
          disabled={!canSubmit || outOfQuota}
          loading={tailoring}
          icon={!tailoring && <Wand2 className="size-4" />}
        >
          {tailoring ? "Rewriting your resume" : "Tailor my resume"}
        </Button>

        {!tailoring && me && !outOfQuota && (
          <p className="text-[0.8125rem] text-ink-faint">
            Uses one of your {me.subscription.remaining} remaining rewrites.
          </p>
        )}
      </div>

      {tailoring && <TailoringProgress />}

      {result && (
        <div ref={resultRef} className="pt-2">
          <TailorResult result={result} />
        </div>
      )}
    </div>
  );
}

/** The numbered pill in each step's heading, ticked once that step is satisfied. */
function StepTitle({
  index,
  done,
  label,
}: {
  index: number;
  done: boolean;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-[0.6875rem] font-bold transition-colors",
          done ? "bg-brand text-on-brand" : "bg-surface-3 text-ink-faint",
        )}
      >
        {done ? <Check className="size-3" aria-hidden /> : index}
      </span>
      {label}
    </span>
  );
}

/**
 * What is shown while the model works.
 *
 * <p>A tailoring takes the better part of a minute, which is long enough that
 * a bare spinner starts to look like a hang. These lines are an honest
 * description of the stages the request goes through, advanced on a timer
 * rather than driven by real progress events -- the endpoint is a single
 * request and does not stream, and pretending otherwise with a percentage that
 * is really just a clock would be worse than saying what it is doing.
 */
function TailoringProgress() {
  const stages = [
    "Reading your resume",
    "Pulling the requirements out of the posting",
    "Matching your experience against them",
    "Rewriting the summary and the bullets",
    "Checking nothing was invented",
  ];
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Stops on the last line rather than looping: a cycle that starts over
      // tells the reader the work restarted.
      setStage((current) => Math.min(current + 1, stages.length - 1));
    }, 9000);
    return () => window.clearInterval(timer);
  }, [stages.length]);

  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
          <span className="pulse-ring absolute inset-0 rounded-xl" aria-hidden />
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-ink"
          >
            {stages[stage]}
          </motion.p>
          <p className="mt-1 text-xs text-ink-faint">
            This usually takes under a minute. Leaving the page cancels it.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

