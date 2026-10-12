"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

/**
 * The landing page header.
 *
 * <p>Transparent over the hero and frosted once the page has scrolled, so the
 * aurora is unobstructed at rest but the links stay readable over content.
 *
 * <p>The right-hand side depends on whether anyone is signed in. While that is
 * still being resolved it renders nothing rather than guessing -- flashing
 * "Log in" at someone who is already logged in is a worse first impression
 * than a quarter second of empty space.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { status, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A menu left open while the viewport grows into the desktop layout would
  // stay mounted but invisible, trapping the page's scroll lock.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const media = window.matchMedia("(min-width: 768px)");
    const close = () => setMenuOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-canvas/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Link href="/" className="flex items-center" aria-label="MatchCV.ai home">
          <Logo size={30} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />

          {status === "authenticated" ? (
            <ButtonLink
              href={isAdmin ? "/admin" : "/app"}
              size="sm"
              iconRight={<ArrowRight className="size-4" />}
            >
              {isAdmin ? "Admin console" : "Open app"}
            </ButtonLink>
          ) : status === "anonymous" ? (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Get started
              </ButtonLink>
            </>
          ) : (
            // Reserve the space so the header does not reflow when it resolves.
            <div className="h-9 w-24" aria-hidden />
          )}

          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-canvas/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4" aria-label="Sections">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-line pt-4">
              <ThemeToggle />
              {status === "anonymous" && (
                <ButtonLink href="/login" variant="secondary" size="sm" className="flex-1">
                  Log in
                </ButtonLink>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
