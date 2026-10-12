"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, FileText, Trash2, Wand2 } from "lucide-react";
import { ResumeDropzone } from "@/components/app/ResumePicker";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import {
  api,
  errorMessage,
  type BaseResumeDetail,
  type BaseResumeSummary,
} from "@/lib/api";
import { compactNumber, formatDate } from "@/lib/utils";

/**
 * The library of uploaded resumes.
 *
 * <p>The preview shows the extracted text rather than the original file,
 * because the extracted text is what actually gets tailored. If a PDF's
 * columns came out interleaved, this is the screen where that is visible --
 * and seeing it here is far better than wondering why the rewrite reads
 * strangely.
 */
export default function ResumesPage() {
  const [resumes, setResumes] = useState<BaseResumeSummary[] | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<BaseResumeDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BaseResumeSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** Re-reads the list after an upload or a delete. Never called from an effect. */
  const load = useCallback(async () => {
    setResumes(await api.listResumes());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await api.listResumes();
        if (!cancelled) {
          setResumes(loaded);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load your resumes."));
          // Empty rather than left null, so the page settles into its real
          // layout instead of showing a skeleton that never resolves.
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
      await load();
      toast.success(`${saved.label} uploaded`);
    } catch (caught) {
      setError(errorMessage(caught, "That file could not be read."));
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (resume: BaseResumeSummary) => {
    setPreviewLoading(true);
    try {
      setPreview(await api.getResume(resume.id));
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not open that resume."));
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteResume(pendingDelete.id);
      setResumes((current) =>
        (current ?? []).filter((resume) => resume.id !== pendingDelete.id),
      );
      toast.success("Resume deleted");
      setPendingDelete(null);
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not delete that resume."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My resumes"
        description="Upload once and tailor from any of these. Keep separate ones if you apply across different kinds of role."
        action={
          <ButtonLink href="/app/tailor" icon={<Wand2 className="size-4" />}>
            Tailor a resume
          </ButtonLink>
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      <Card>
        <CardHeader
          title="Add a resume"
          description="The file is parsed on the server and the original is not kept — only the text it contains."
          icon={<FileText className="size-[1.125rem]" />}
        />
        <CardBody>
          <ResumeDropzone onFile={upload} uploading={uploading} />
        </CardBody>
      </Card>

      {resumes === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No resumes yet"
          description="Upload a PDF, DOCX or text file above to get started."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardBody className="flex items-start gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-brand">
                  <FileText className="size-5" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-ink">
                    {resume.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-faint">
                    {resume.sourceFilename ?? "pasted text"}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Badge>{resume.sourceType}</Badge>
                    <span className="text-xs text-ink-faint">
                      {compactNumber(resume.characterCount)} characters &middot; added{" "}
                      {formatDate(resume.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <IconButton
                    label="Preview the extracted text"
                    size="sm"
                    onClick={() => openPreview(resume)}
                    disabled={previewLoading}
                  >
                    <Eye className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete this resume"
                    size="sm"
                    onClick={() => setPendingDelete(resume)}
                    className="text-ink-faint hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.label ?? "Resume"}
        description="This is the text the model is given. If something here looks garbled, the rewrite will reflect that."
        size="lg"
      >
        <pre className="whitespace-pre-wrap break-words font-mono text-[0.8125rem] leading-relaxed text-ink-muted">
          {preview?.extractedText}
        </pre>
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this resume?"
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
          <span className="font-medium text-ink">{pendingDelete?.label}</span> will be
          removed. Resumes you have already tailored from it are kept — deleting the
          original does not destroy the rewrites it produced.
        </p>
      </Modal>
    </div>
  );
}
