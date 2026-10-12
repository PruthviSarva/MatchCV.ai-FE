"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Feedback";
import { api, type PlanOption } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Pricing, read from the API rather than written into the page.
 *
 * <p>`/api/billing/plans` is public precisely so this section can exist, and
 * the allowances in it are the same numbers the quota service enforces. A
 * hard-coded "3 free rewrites" here would be a promise the server has no idea
 * it is making, and the first time the limit is tuned the landing page starts
 * lying.
 *
 * <p>If the API cannot be reached the section still renders, with the plan
 * names and the shapes in place and the numbers left blank. A pricing block
 * that vanishes when the backend hiccups looks like a broken page; one that is
 * honestly incomplete does not.
 */
export function Pricing() {
  const [plans, setPlans] = useState<PlanOption[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .plans()
      .then((loaded) => {
        if (!cancelled) {
          setPlans(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="pricing" className="relative px-5 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-brand">
          Pricing
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Start free. Upgrade only if it earns it.
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-ink-muted">
          The free plan is a real plan, not a teaser — enough rewrites to find
          out whether the output is any good before anything is asked of you.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
        {plans
          ? plans.map((plan, index) => (
              <Reveal key={plan.plan} delay={index * 0.08}>
                <PlanCard plan={plan} />
              </Reveal>
            ))
          : failed
            ? FALLBACK.map((plan, index) => (
                <Reveal key={plan.plan} delay={index * 0.08}>
                  <PlanCard plan={plan} />
                </Reveal>
              ))
            : [0, 1].map((index) => (
                <Skeleton key={index} className="h-[22rem] rounded-2xl" />
              ))}
      </div>

      <p className="mt-8 text-center text-[0.8125rem] text-ink-faint">
        Pro checkout is not wired up to a payment provider yet. The button says
        so rather than pretending otherwise.
      </p>
    </section>
  );
}

function PlanCard({ plan }: { plan: PlanOption }) {
  const isPro = plan.plan === "PRO";

  return (
    <div
      className={cn(
        "edge-light relative flex h-full flex-col rounded-2xl border p-6",
        isPro
          ? "border-brand-line bg-gradient-to-b from-brand-soft to-surface"
          : "border-line bg-surface",
      )}
    >
      {isPro && (
        <Badge tone="brand" className="absolute -top-3 right-6" icon={<Sparkles className="size-3" />}>
          Coming soon
        </Badge>
      )}

      <h3 className="text-[0.9375rem] font-semibold text-ink">{plan.name}</h3>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink">
        {plan.priceLabel}
      </p>
      <p className="mt-1.5 text-sm text-ink-muted">
        {plan.monthlyTailorings > 0
          ? `${plan.monthlyTailorings} tailored resumes a month`
          : "Allowance unavailable"}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-muted">
            <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <ButtonLink
        href="/signup"
        variant={isPro ? "secondary" : "primary"}
        fullWidth
        className="mt-7"
      >
        {isPro ? "Start free, upgrade later" : "Get started free"}
      </ButtonLink>
    </div>
  );
}

/**
 * Shown only when the API is unreachable. The allowances are deliberately
 * absent rather than guessed -- the numbers belong to the server.
 */
const FALLBACK: PlanOption[] = [
  {
    plan: "FREE",
    name: "Free",
    monthlyTailorings: 0,
    priceLabel: "Free",
    features: [
      "ATS-clean PDF and DOCX download",
      "Keyword gap report",
      "Tailoring history",
    ],
  },
  {
    plan: "PRO",
    name: "Pro",
    monthlyTailorings: 0,
    priceLabel: "Coming soon",
    features: [
      "A much larger monthly allowance",
      "Unlimited saved base resumes",
      "Full tailoring history",
    ],
  },
];
