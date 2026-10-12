import Link from "next/link";
import { Logo, TAGLINE } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line px-5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo size={28} />
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{TAGLINE}</p>
        </div>

        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
          <a href="#how" className="text-ink-muted transition-colors hover:text-ink">
            How it works
          </a>
          <Link href="/login" className="text-ink-muted transition-colors hover:text-ink">
            Log in
          </Link>
          <a href="#features" className="text-ink-muted transition-colors hover:text-ink">
            Features
          </a>
          <Link href="/signup" className="text-ink-muted transition-colors hover:text-ink">
            Create account
          </Link>
          <a href="#pricing" className="text-ink-muted transition-colors hover:text-ink">
            Pricing
          </a>
          <a href="#faq" className="text-ink-muted transition-colors hover:text-ink">
            FAQ
          </a>
        </nav>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-line pt-6 text-xs text-ink-faint">
        <p>
          MatchCV.ai rewrites what your resume already supports. It does not add
          experience you do not have, and it tells you what it had to leave out.
        </p>
      </div>
    </footer>
  );
}
