"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Lock, Mail, User } from "lucide-react";
import { Logo, TAGLINE } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ErrorNote, FullPageLoader } from "@/components/ui/Feedback";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Mode = "login" | "signup";

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Pick up where you left off — your resumes and history are waiting.",
    submit: "Log in",
    switchPrompt: "New here?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Three tailored rewrites a month, free. No card required.",
    submit: "Create account",
    switchPrompt: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
} as const;

const PROMISES = [
  "Rewrites only what your resume already supports",
  "ATS-clean DOCX and PDF, rendered server-side",
  "Tells you every requirement it could not claim",
];

/**
 * Login and signup.
 *
 * <p>One component for both, because they differ by a single field and a few
 * strings. Two near-identical files would drift the moment either one is
 * touched -- and this is the screen where a small inconsistency is most
 * noticeable.
 */
export function AuthScreen({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, isAdmin, signIn, signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Where to land afterwards. The `next` parameter is set by the route guards
  // when they bounce someone here, so a deep link survives the detour.
  const next = searchParams.get("next");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(next ?? (isAdmin ? "/admin" : "/app"));
    }
  }, [status, isAdmin, next, router]);

  // Avoids painting the form for a split second before the redirect fires.
  if (status === "loading" || status === "authenticated") {
    return <FullPageLoader label="Checking your session" />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});

    try {
      if (mode === "signup") {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      // The effect above handles the redirect once the session resolves.
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors);
      } else {
        setError("Something went wrong. Try again.");
      }
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen">
      {/* Left: the brand half. Hidden below large screens, where it would
          push the form itself below the fold on a phone. */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-line bg-canvas-raised p-10 lg:flex">
        <div className="aurora" aria-hidden />
        <div className="grid-veil" aria-hidden />

        <Link href="/" className="relative inline-flex w-fit items-center">
          <Logo size={32} />
        </Link>

        <div className="relative max-w-sm">
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-[-0.02em]">
            {TAGLINE}
          </h2>
          <ul className="mt-8 space-y-3.5">
            {PROMISES.map((promise, index) => (
              <motion.li
                key={promise}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.45 }}
                className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-brand-line bg-brand-soft text-brand">
                  <Check className="size-3" aria-hidden />
                </span>
                {promise}
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-faint">
          Your resume file is parsed to text on upload and the original is not kept.
        </p>
      </aside>

      {/* Right: the form. */}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between p-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink lg:invisible"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-sm"
          >
            <Link href="/" className="mb-8 inline-flex lg:hidden">
              <Logo size={30} />
            </Link>

            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{copy.subtitle}</p>

            <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
              {mode === "signup" && (
                <Input
                  label="Name"
                  type="text"
                  required
                  autoComplete="name"
                  autoFocus
                  placeholder="Priya Sharma"
                  icon={<User className="size-4" aria-hidden />}
                  value={name}
                  error={fieldErrors.name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}

              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                autoFocus={mode === "login"}
                placeholder="you@example.com"
                icon={<Mail className="size-4" aria-hidden />}
                value={email}
                error={fieldErrors.email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <Input
                label="Password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                icon={<Lock className="size-4" aria-hidden />}
                value={password}
                error={fieldErrors.password}
                hint={mode === "signup" ? "8 characters minimum" : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />

              {error && <ErrorNote>{error}</ErrorNote>}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={busy}
                iconRight={!busy && <ArrowRight className="size-4" />}
              >
                {copy.submit}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              {copy.switchPrompt}{" "}
              <Link
                href={copy.switchHref}
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                {copy.switchLabel}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
