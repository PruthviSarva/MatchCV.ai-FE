"use client";

import { useState } from "react";
import {
  ArrowRight,
  ClipboardPaste,
  Download,
  FileSearch,
  FileText,
  Gauge,
  History,
  Minus,
  Plus,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** The heading pattern every marketing section below shares. */
function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-brand">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty leading-relaxed text-ink-muted">{description}</p>
      )}
    </Reveal>
  );
}

/* ------------------------------------------------------------ how it works */

const STEPS = [
  {
    icon: Upload,
    title: "Upload your resume once",
    body: "PDF, DOCX or plain text. It is parsed on the server and saved to your account, so you never upload it again.",
  },
  {
    icon: ClipboardPaste,
    title: "Paste the posting",
    body: "The whole thing — responsibilities, requirements, the lot. The more of it you paste, the more there is to match against.",
  },
  {
    icon: Download,
    title: "Download the rewrite",
    body: "An ATS-clean DOCX or PDF, laid out for machines to parse, plus a note on every requirement it could not honestly claim.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative px-5 py-24">
      <SectionIntro
        eyebrow="How it works"
        title="Three steps, about a minute"
        description="No profile to build, no wizard to sit through. The slow part is the model reading your resume against the posting, and that is the part you cannot do faster by hand."
      />

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.1}>
            <div className="edge-light relative h-full rounded-2xl border border-line bg-surface p-6">
              {/* The step number sits behind the icon as a watermark, so the
                  order is legible without stealing attention from the title. */}
              <span
                className="absolute right-5 top-4 font-mono text-4xl font-semibold text-ink/5"
                aria-hidden
              >
                0{index + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-xl border border-brand-line bg-brand-soft text-brand">
                <step.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-[0.9375rem] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ features */

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "It will not invent experience",
    body: "If the posting wants Terraform and your resume has never mentioned it, MatchCV.ai leaves it off and tells you it did. A resume that claims skills you cannot defend fails at the interview instead of at the filter.",
    wide: true,
  },
  {
    icon: ScanLine,
    title: "Built to survive the screener",
    body: "Single column, real headings, no tables or text boxes. The file is rendered on the server, not printed from a browser.",
  },
  {
    icon: Gauge,
    title: "A match score you can act on",
    body: "Coverage of the posting's stated requirements, with the specific gaps listed rather than hidden in a number.",
  },
  {
    icon: FileSearch,
    title: "Keyword gap report",
    body: "The terms the posting asks for that your resume cannot support — the shortlist of what to actually go and learn.",
  },
  {
    icon: History,
    title: "Every rewrite kept",
    body: "Each tailoring stays in your history with its posting and score, so you can send the same role a follow-up without starting over.",
  },
  {
    icon: FileText,
    title: "Several base resumes",
    body: "Keep a backend one and a management one. Pick which to tailor from on each run.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-5 py-24">
      <SectionIntro
        eyebrow="What you get"
        title="Honest tailoring, not keyword stuffing"
        description="Anything can shuffle words until a posting's terms appear. The useful part is knowing what your resume genuinely supports — and what it does not."
      />

      <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal
            key={feature.title}
            delay={index * 0.06}
            className={cn(feature.wide && "sm:col-span-2")}
          >
            <div
              className={cn(
                "edge-light group h-full rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong",
                feature.wide && "bg-gradient-to-br from-surface to-brand-soft",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-brand transition-transform group-hover:scale-105">
                <feature.icon className="size-[1.125rem]" aria-hidden />
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- faq */

const QUESTIONS = [
  {
    q: "Does it make things up?",
    a: "No, and that is the whole design. The model is told to rewrite what your resume already supports and to report anything it cannot. Every requirement it had to leave out comes back to you as a keyword gap rather than quietly appearing as a skill you would have to defend in an interview.",
  },
  {
    q: "Will the file pass an applicant tracking system?",
    a: "The DOCX and PDF are laid out on the server specifically to be parsed: a single column, real section headings, no tables, no text boxes, no images. DOCX is offered first because it is the format screening software handles most reliably.",
  },
  {
    q: "What happens to my resume?",
    a: "The original file is not kept. It is parsed to text on upload and the text is what is stored against your account, because the text is all the rewriting needs and the output is a freshly generated document.",
  },
  {
    q: "How many rewrites do I get?",
    a: "Three a month on the free plan, which is enough to decide whether this is useful to you. The allowance resets on a rolling period from when you signed up, not on the first of the month.",
  },
  {
    q: "Can I keep more than one resume?",
    a: "Yes. Upload as many base resumes as you like and choose which one to tailor from on each run — useful if you are applying across two quite different kinds of role.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-5 py-24">
      <SectionIntro eyebrow="Questions" title="The things worth asking first" />

      <div className="mx-auto mt-12 max-w-2xl divide-y divide-[color:var(--line)] border-y border-line">
        {QUESTIONS.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.q}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[0.9375rem] font-medium text-ink">{item.q}</span>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-muted">
                    {isOpen ? (
                      <Minus className="size-3.5" aria-hidden />
                    ) : (
                      <Plus className="size-3.5" aria-hidden />
                    )}
                  </span>
                </button>
              </h3>
              {/*
                Kept in the DOM and collapsed with a grid row rather than
                unmounted, so the answers are findable with the browser's own
                in-page search even while closed.
              */}
              <div
                id={`faq-panel-${index}`}
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="pr-11 text-sm leading-relaxed text-ink-muted">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- closing */

export function CtaBand() {
  return (
    <section className="relative px-5 py-24">
      <Reveal className="mx-auto max-w-4xl">
        <div className="edge-light relative overflow-hidden rounded-3xl border border-brand-line bg-surface px-6 py-14 text-center">
          <div className="aurora opacity-60" aria-hidden />
          <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Stop sending the same resume everywhere
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-ink-muted">
              Three tailored rewrites a month, free. No card, no trial countdown.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href="/signup"
                size="lg"
                iconRight={<ArrowRight className="size-4" />}
              >
                Create your account
              </ButtonLink>
              <ButtonLink href="/login" variant="glass" size="lg">
                I already have one
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
