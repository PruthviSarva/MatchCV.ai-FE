"use client";

import { useRef, useState } from "react";
import { Check, FileText, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, compactNumber, relativeTime } from "@/lib/utils";
import type { BaseResumeSummary } from "@/lib/api";

const ACCEPT = ".pdf,.docx,.txt,.md";

/**
 * A drop target for a resume file.
 *
 * <p>The drag counter is not decoration. `dragleave` fires every time the
 * pointer crosses into a child element, so tracking a boolean makes the
 * highlight flicker as the cursor moves over the icon and the text inside the
 * zone. Counting enters against leaves is what keeps it steady.
 *
 * <p>The file is handed straight to the caller. No parsing happens in the
 * browser -- the server reads the PDF or DOCX, which is why a resume saved
 * from any machine produces the same text.
 */
export function ResumeDropzone({
  onFile,
  uploading,
  compact = false,
}: {
  onFile: (file: File) => void;
  uploading: boolean;
  compact?: boolean;
}) {
  const [dragDepth, setDragDepth] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const dragging = dragDepth > 0;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      onFile(file);
    }
  };

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setDragDepth((depth) => depth + 1);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragDepth((depth) => Math.max(0, depth - 1));
      }}
      // Without preventDefault on dragover the browser refuses the drop and
      // navigates to the file instead, which looks like the app crashing.
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setDragDepth(0);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "relative rounded-2xl border border-dashed text-center transition-colors",
        compact ? "p-5" : "p-8",
        dragging
          ? "border-brand bg-brand-soft"
          : "border-line bg-surface-2 hover:border-line-strong",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        disabled={uploading}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Cleared so picking the same file twice still fires a change.
          event.target.value = "";
        }}
        className="sr-only"
        id="resume-file-input"
      />

      <label
        htmlFor="resume-file-input"
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-2xl border transition-colors",
            compact ? "size-10" : "size-14",
            dragging
              ? "border-brand-line bg-brand-soft text-brand"
              : "border-line bg-surface text-ink-faint",
          )}
        >
          {uploading ? (
            <Loader2 className={cn("animate-spin", compact ? "size-4" : "size-6")} aria-hidden />
          ) : (
            <Upload className={cn(compact ? "size-4" : "size-6")} aria-hidden />
          )}
        </span>

        <span>
          <span className="block text-sm font-medium text-ink">
            {uploading
              ? "Reading your resume..."
              : dragging
                ? "Drop it here"
                : "Drop a resume, or click to choose"}
          </span>
          <span className="mt-1 block text-xs text-ink-faint">
            PDF, DOCX, TXT or Markdown. Parsed on the server.
          </span>
        </span>
      </label>
    </div>
  );
}

/**
 * The saved resumes, as a radio group.
 *
 * <p>Real radio inputs behind the cards rather than divs with click handlers,
 * so arrow keys move between them and a screen reader announces how many
 * options there are -- both of which come free with the native control and
 * have to be rebuilt by hand otherwise.
 */
export function ResumeChooser({
  resumes,
  selectedId,
  onSelect,
  className,
}: {
  resumes: BaseResumeSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  className?: string;
}) {
  if (resumes.length === 0) {
    return null;
  }

  return (
    <fieldset className={className}>
      <legend className="sr-only">Choose which resume to tailor from</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {resumes.map((resume) => {
          const selected = resume.id === selectedId;
          return (
            <label
              key={resume.id}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                selected
                  ? "border-brand-line bg-brand-soft"
                  : "border-line bg-surface-2 hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="base-resume"
                value={resume.id}
                checked={selected}
                onChange={() => onSelect(resume.id)}
                className="sr-only"
              />

              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                  selected
                    ? "border-brand-line bg-brand text-on-brand"
                    : "border-line bg-surface text-ink-faint",
                )}
              >
                {selected ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <FileText className="size-4" aria-hidden />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {resume.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-faint">
                  {compactNumber(resume.characterCount)} characters &middot; added{" "}
                  {relativeTime(resume.createdAt)}
                </span>
              </span>

              <Badge tone={selected ? "brand" : "neutral"}>
                {resume.sourceType}
              </Badge>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
