"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Meter, StatCard } from "@/components/ui/Metrics";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth";
import { api, errorMessage, type PlanOption } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

/**
 * Plan and usage.
 *
 * <p>The page is honest about the state of checkout. `checkoutStubbed` comes
 * back on the subscription itself, so the button text is driven by what the
 * server actually does rather than by a constant in the frontend that someone
 * has to remember to flip on the day a payment provider is wired in.
 */
export default function BillingPage() {
  const { me, refresh } = useAuth();
  const [plans, setPlans] = useState<PlanOption[] | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    api
      .plans()
      .then(setPlans)
      .catch((caught) => {
        setError(errorMessage(caught, "Could not load the plans."));
        setPlans([]);
      });
  }, []);

  if (!me) {
    return null;
  }

  const { subscription } = me;

  const switchToPro = async () => {
    setWorking(true);
    setError("");
    try {
      await api.subscribe("PRO");
      await refresh();
      toast.success("You are on the Pro plan");
    } catch (caught) {
      setError(errorMessage(caught, "Could not change your plan."));
    } finally {
      setWorking(false);
    }
  };

  const cancel = async () => {
    setWorking(true);
    setError("");
    try {
      await api.cancelSubscription();
      await refresh();
      setConfirmCancel(false);
      toast.success("Pro will end when this period does");
    } catch (caught) {
      setError(errorMessage(caught, "Could not cancel."));
    } finally {
      setWorking(false);
    }
  };

  const percentUsed =
    subscription.monthlyTailorings > 0
      ? Math.round((subscription.used / subscription.monthlyTailorings) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Plan and usage"
        description="Where you stand this period, and what the other plan offers."
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {/* Current state. */}
      <Card glow={subscription.plan === "PRO"}>
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              {subscription.plan === "PRO" ? "Pro plan" : "Free plan"}
              <Badge tone={subscription.status === "ACTIVE" ? "brand" : "warn"} dot>
                {subscription.status === "ACTIVE" ? "Active" : "Ends at period end"}
              </Badge>
            </span>
          }
          description={`This period runs ${formatDate(subscription.periodStart)} to ${formatDate(subscription.periodEnd)}.`}
          icon={<CreditCard className="size-[1.125rem]" />}
        />
        <CardBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Used" value={subscription.used} hint="this period" />
            <StatCard
              label="Remaining"
              value={subscription.remaining}
              hint={`of ${subscription.monthlyTailorings}`}
              tone={subscription.remaining === 0 ? "danger" : "brand"}
            />
            <StatCard
              label="Resets"
              value={formatDate(subscription.periodEnd)}
              hint="allowance returns to full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[0.8125rem]">
              <span className="text-ink-muted">Allowance used</span>
              <span className="font-mono tabular-nums text-ink-muted">
                {percentUsed}%
              </span>
            </div>
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
            />
          </div>

          {/*
            The period is a rolling 30 days from when the plan started, not a
            calendar month. Said plainly here because "resets monthly" is the
            assumption everyone brings, and being surprised by a reset date is
            the kind of small thing that erodes trust in the numbers.
          */}
          <p className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
            Your period is a rolling 30 days from when the plan started, not the
            calendar month. Deleting a rewrite from your history gives its slot
            back.
          </p>
        </CardBody>
      </Card>

      {/* The catalogue. */}
      <div>
        <h2 className="mb-4 text-[0.9375rem] font-semibold text-ink">Plans</h2>
        {plans === null ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => {
              const current = plan.plan === subscription.plan;
              return (
                <Card
                  key={plan.plan}
                  className={cn(current && "border-brand-line bg-brand-soft/30")}
                >
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[0.9375rem] font-semibold text-ink">
                          {plan.name}
                        </h3>
                        <p className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-ink">
                          {plan.priceLabel}
                        </p>
                      </div>
                      {current && <Badge tone="brand">Current</Badge>}
                    </div>

                    <ul className="mt-5 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm text-ink-muted"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {current ? (
                        plan.plan === "PRO" && subscription.status === "ACTIVE" ? (
                          <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setConfirmCancel(true)}
                          >
                            Cancel Pro
                          </Button>
                        ) : (
                          <Button variant="secondary" fullWidth disabled>
                            Your current plan
                          </Button>
                        )
                      ) : plan.plan === "PRO" ? (
                        <Button
                          fullWidth
                          loading={working}
                          onClick={switchToPro}
                          icon={<Sparkles className="size-4" />}
                        >
                          {subscription.checkoutStubbed
                            ? "Switch to Pro (no payment yet)"
                            : "Upgrade to Pro"}
                        </Button>
                      ) : (
                        <Button variant="secondary" fullWidth disabled>
                          Downgrade by cancelling Pro
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {subscription.checkoutStubbed && (
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-faint">
            No payment provider is connected yet, so switching plans here moves
            the allowance without charging anything. The button says so rather
            than implying a transaction that does not happen.
          </p>
        )}
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel Pro?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep Pro
            </Button>
            <Button variant="danger" loading={working} onClick={cancel}>
              Cancel Pro
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          Pro keeps running until {formatDate(subscription.periodEnd)}, then the
          account drops to the free allowance. Nothing is lost — your resumes and
          your history stay exactly where they are.
        </p>
      </Modal>
    </div>
  );
}
