"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/Metrics";
import { TAGLINE } from "@/components/brand/Logo";

/**
 * The first screen.
 *
 * <p>The headline makes the product's actual promise rather than a category
 * claim: one resume, rewritten per posting. The three pills under the buttons
 * are the three objections a careful person has about an AI resume tool --
 * does it lie, is it readable by the screening software, how long does it take
 * -- answered before they are asked.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:pt-40">
      <div className="aurora" aria-hidden />
      <div className="grid-veil" aria-hidden />

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-brand-soft px-3.5 py-1.5 text-[0.8125rem] font-medium text-brand"
        >
          <Sparkles className="size-3.5" aria-hidden />
          Tailored by Claude, checked against the posting
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-6xl"
        >
          One resume.
          <br />
          <span className="text-gradient">Every opportunity.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          Upload your resume once. Paste any job posting. MatchCV.ai rewrites it
          for that role in under a minute — and tells you exactly which
          requirements it could not honestly claim.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <ButtonLink
            href="/signup"
            size="lg"
            iconRight={<ArrowRight className="size-4" />}
          >
            Tailor my resume free
          </ButtonLink>
          <ButtonLink href="#how" variant="glass" size="lg">
            See how it works
          </ButtonLink>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.8125rem] text-ink-faint"
        >
          {[
            { icon: ShieldCheck, text: "Never invents experience you do not have" },
            { icon: FileCheck2, text: "ATS-clean DOCX and PDF" },
            { icon: Zap, text: "Three free rewrites a month" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-brand" aria-hidden />
              {text}
            </li>
          ))}
        </motion.ul>

        <p className="sr-only">{TAGLINE}</p>
      </div>

      <HeroPreview />
    </section>
  );
}

/**
 * A still of the product, built from the same tokens as the real screens.
 *
 * <p>Drawn in markup rather than shipped as a screenshot: it restyles itself
 * with the theme, stays sharp on any display, and cannot go stale the next
 * time the workbench changes. The content is illustrative and labelled as an
 * example, so it is never mistaken for someone's real result.
 */
function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
      className="relative mx-auto mt-16 max-w-5xl"
      aria-label="Example of a tailored resume result"
    >
      {/* The glow that makes the panel sit above the aurora rather than in it. */}
      <div
        className="absolute -inset-x-10 -top-6 bottom-10 rounded-[2rem] bg-[color:var(--brand)]/10 blur-3xl"
        aria-hidden
      />

      <div className="edge-light relative overflow-hidden rounded-2xl border border-line-strong bg-surface/90 shadow-floating backdrop-blur-xl">
        {/* Window chrome, so the panel reads as an application. */}
        <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[color:var(--danger)]/60" />
            <span className="size-2.5 rounded-full bg-[color:var(--warn)]/60" />
            <span className="size-2.5 rounded-full bg-[color:var(--brand)]/60" />
          </span>
          <span className="ml-2 font-mono text-[0.6875rem] text-ink-faint">
            matchcv.ai/app/tailor
          </span>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-[1.25fr_1fr]">
          {/* Left: the posting that was pasted in. */}
          <div className="bg-surface p-5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Job description
            </p>
            <p className="mt-3 text-[0.8125rem] font-medium text-ink">
              Senior Backend Engineer — Payments
            </p>
            <div className="mt-3 space-y-2" aria-hidden>
              {["w-full", "w-11/12", "w-10/12", "w-full", "w-8/12"].map((width, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full bg-surface-3 ${width}`}
                />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Java", "Kubernetes", "Stripe", "Postgres", "Event-driven"].map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-[0.6875rem] text-ink-muted"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Right: the result, led by the score. */}
          <div className="flex flex-col items-center justify-center gap-4 bg-surface-2 p-5">
            <ScoreRing score={94} size={104} thickness={8} />
            <div className="w-full space-y-2">
              {[
                "Led summary with payments-platform scope",
                "Surfaced Kubernetes work from 2024",
                "Reordered bullets to match the posting",
              ].map((note) => (
                <p
                  key={note}
                  className="flex items-start gap-2 text-[0.75rem] leading-snug text-ink-muted"
                >
                  <CheckCircle2
                    className="mt-0.5 size-3.5 shrink-0 text-brand"
                    aria-hidden
                  />
                  {note}
                </p>
              ))}
            </div>
            <div className="w-full rounded-lg border border-[color:var(--warn)]/25 bg-warn-soft px-3 py-2 text-[0.6875rem] leading-snug text-warn">
              Not claimed: Terraform, SOC 2 audits
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink-faint">
        Illustrative example. Your result is built from your own resume.
      </p>
    </motion.div>
  );
}
