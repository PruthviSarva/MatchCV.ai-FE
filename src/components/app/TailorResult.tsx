"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  FileDown,
  Printer,
  TriangleAlert,
} from "lucide-react";
import ResumeDocument from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/Metrics";
import { api, errorMessage, type TailoredResumeDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

/**
 * A finished tailoring: the score, what changed, what could not be claimed,
 * and the document itself.
 *
 * <p>Ordered so the honest part comes before the pretty part. The gap report
 * sits above the resume preview because it is the thing worth acting on, and
 * burying it under a nicely typeset document is how a tool ends up quietly
 * encouraging people to send out claims they cannot defend.
 */
export function TailorResult({ result }: { result: TailoredResumeDetail }) {
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const { resume } = result;

  const download = async (format: "pdf" | "docx") => {
    setDownloading(format);
    try {
      await api.download(result.id, format);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (caught) {
      toast.error(errorMessage(caught, "The download failed."));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Headline: score, title, and the two ways to get the file. */}
      <Card glow className="no-print overflow-hidden">
        <CardBody className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={result.matchScore} size={132} />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-balance text-xl font-semibold tracking-[-0.01em] text-ink">
              {result.jobTitle}
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Rewritten by {result.modelName} &middot;{" "}
              {formatDateTime(result.createdAt)}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
              {/*
                DOCX first, and as the primary button: it is the format
                applicant tracking systems parse most reliably. PDF looks
                better to a human and is the second choice for that reason.
              */}
              <Button
                onClick={() => download("docx")}
                loading={downloading === "docx"}
                icon={<FileDown className="size-4" />}
              >
                Download DOCX
              </Button>
              <Button
                variant="secondary"
                onClick={() => download("pdf")}
                loading={downloading === "pdf"}
                icon={<Download className="size-4" />}
              >
                PDF
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.print()}
                icon={<Printer className="size-4" />}
              >
                Print
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="no-print grid gap-5 lg:grid-cols-2">
        {resume.tailoringNotes.length > 0 && (
          <Card>
            <CardHeader
              title="What changed"
              description="The edits made to fit this posting."
              icon={<CheckCircle2 className="size-[1.125rem]" />}
            />
            <CardBody>
              <ul className="space-y-2.5">
                {resume.tailoringNotes.map((note, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-muted"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      aria-hidden
                    />
                    {note}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {resume.missingKeywords.length > 0 && (
          <Card className="border-[color:var(--warn)]/25">
            <CardHeader
              title="Not claimed on your resume"
              description="The posting asks for these and your resume does not support them, so they were left off rather than invented."
              icon={<TriangleAlert className="size-[1.125rem] text-warn" />}
            />
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {resume.missingKeywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    className="border-[color:var(--warn)]/25 bg-warn-soft text-warn"
                  >
                    {keyword}
                  </Chip>
                ))}
              </div>
              <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-faint">
                This is the honest gap between you and the role. Worth a line in
                the cover letter if you have adjacent experience — and worth
                learning if this is the job you want.
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* The document. Wrapped in the print area so Ctrl+P produces only this. */}
      <div>
        <p className="no-print mb-3 text-[0.8125rem] text-ink-faint">
          Preview of the generated file. The download is rendered on the server,
          so this is what the employer receives.
        </p>
        <div className="resume-print-area">
          <ResumeDocument data={resume} />
        </div>
      </div>
    </div>
  );
}
