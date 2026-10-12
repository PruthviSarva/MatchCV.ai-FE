"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Shield,
  SquareArrowOutUpRight,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Metrics";
import { ErrorNote, FullPageLoader } from "@/components/ui/Feedback";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ButtonLink } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { cn, initials } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Matches child routes too. Off for index routes that would match everything. */
  exact?: boolean;
}

/**
 * The frame every signed-in screen sits in.
 *
 * <p>One component serves both the user app and the admin console: they differ
 * by their navigation list and by whether ROLE_ADMIN is required, not by their
 * layout. Two shells would drift apart, and the admin console is exactly the
 * place where a subtly different header is most disorienting.
 *
 * <p>The guard here is for the interface, not for security. Access is decided
 * by the server on every request -- it re-reads the account's role and its
 * active flag rather than trusting the token -- so the worst a bypass of this
 * check achieves is an empty screen full of 403s.
 */
export function AppShell({
  nav,
  requireAdmin = false,
  children,
}: {
  nav: NavItem[];
  requireAdmin?: boolean;
  children: ReactNode;
}) {
  const { status, me, isAdmin, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // The drawer records which route it was opened on rather than storing a
  // boolean. Navigating has to close it -- leaving it open over the new page
  // is a classic way to make a phone feel broken -- and comparing against the
  // live pathname does that by construction, with no effect reaching back in
  // to correct state after the fact.
  const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
  const drawerOpen = drawerOpenedAt === pathname;

  useEffect(() => {
    if (status === "anonymous") {
      // Carry the destination through, so logging in lands where they meant
      // to go rather than dumping everyone on the dashboard.
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated" || !me) {
    return <FullPageLoader label="Loading your account" />;
  }

  if (requireAdmin && !isAdmin) {
    return <NotAdmin />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-canvas-raised lg:flex">
        <SidebarContent nav={nav} isAdmin={isAdmin} requireAdmin={requireAdmin} />
      </aside>

      {/* Mobile drawer. */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpenedAt(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
              className="relative flex h-full w-72 flex-col border-r border-line bg-canvas-raised"
            >
              <button
                type="button"
                onClick={() => setDrawerOpenedAt(null)}
                aria-label="Close navigation"
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
              <SidebarContent nav={nav} isAdmin={isAdmin} requireAdmin={requireAdmin} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setDrawerOpenedAt(pathname)} requireAdmin={requireAdmin} />

        <main className="flex-1 px-5 py-7 sm:px-7">
          <div className="mx-auto w-full max-w-6xl">
            {error && <ErrorNote className="mb-5">{error}</ErrorNote>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- sidebar */

function SidebarContent({
  nav,
  isAdmin,
  requireAdmin,
}: {
  nav: NavItem[];
  isAdmin: boolean;
  requireAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href={requireAdmin ? "/admin" : "/app"} className="flex items-center">
          <Logo size={28} />
        </Link>
        {requireAdmin && (
          <Badge tone="violet" className="ml-2.5">
            Admin
          </Badge>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              {/* The marker is a separate element rather than a left border, so
                  it can be inset from the rounded corners. */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand"
                  aria-hidden
                />
              )}
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        {/* The bridge between the two shells, shown only to someone who can
            actually use the other side. */}
        {isAdmin &&
          (requireAdmin ? (
            <ButtonLink
              href="/app"
              variant="secondary"
              size="sm"
              fullWidth
              icon={<SquareArrowOutUpRight className="size-3.5" />}
            >
              Back to the app
            </ButtonLink>
          ) : (
            <ButtonLink
              href="/admin"
              variant="secondary"
              size="sm"
              fullWidth
              icon={<Shield className="size-3.5" />}
            >
              Admin console
            </ButtonLink>
          ))}

        {!requireAdmin && <QuotaCard />}
      </div>
    </>
  );
}

/**
 * The remaining allowance.
 *
 * <p>Turns amber at one left and red at none, so running out is visible before
 * it is a blocked button on the tailor screen.
 */
function QuotaCard() {
  const { me } = useAuth();
  if (!me) {
    return null;
  }

  const { plan, used, remaining, monthlyTailorings } = me.subscription;
  const tone = remaining === 0 ? "danger" : remaining <= 1 ? "warn" : "brand";

  return (
    <div className="rounded-xl border border-line bg-surface p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.8125rem] font-medium text-ink">
          {plan === "PRO" ? "Pro" : "Free"} plan
        </span>
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {used}/{monthlyTailorings}
        </span>
      </div>
      <Meter value={used} max={monthlyTailorings} tone={tone} className="mt-2.5" />
      <p className="mt-2 text-xs text-ink-faint">
        {remaining === 0
          ? "No rewrites left this period"
          : `${remaining} rewrite${remaining === 1 ? "" : "s"} left`}
      </p>
      {plan === "FREE" && (
        <Link
          href="/app/billing"
          className="mt-2.5 inline-block text-xs font-medium text-brand underline-offset-4 hover:underline"
        >
          See plans
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ topbar */

function Topbar({
  onOpenNav,
  requireAdmin,
}: {
  onOpenNav: () => void;
  requireAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/80 px-5 backdrop-blur-xl sm:px-7">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="flex size-9 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <Link href={requireAdmin ? "/admin" : "/app"} className="lg:hidden">
        <LogoMark size={26} />
      </Link>

      <div className="flex-1" />

      <ThemeToggle />
      <UserMenu />
    </header>
  );
}

/**
 * The account dropdown.
 *
 * <p>Closed by a click anywhere else and by Escape. Both matter: a menu that
 * can only be dismissed by clicking its own trigger is the single most common
 * way a dropdown ends up feeling stuck.
 */
function UserMenu() {
  const { me, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) {
    return null;
  }

  const signOutAndLeave = async () => {
    setOpen(false);
    await signOut();
    router.replace("/");
  };

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-line-strong"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-[0.6875rem] font-bold text-on-brand">
          {initials(me.user.name, me.user.email)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium text-ink sm:block">
          {me.user.name}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-faint transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="edge-light absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-floating"
          >
            <div className="border-b border-line p-3.5">
              <p className="truncate text-sm font-medium text-ink">{me.user.name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">{me.user.email}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge tone={me.subscription.plan === "PRO" ? "brand" : "neutral"}>
                  {me.subscription.plan === "PRO" ? "Pro" : "Free"}
                </Badge>
                {isAdmin && <Badge tone="violet">Admin</Badge>}
              </div>
            </div>

            <div className="p-1.5">
              <MenuLink href="/app/settings" icon={<Settings className="size-4" />}>
                Settings
              </MenuLink>
              {isAdmin && (
                <MenuLink href="/admin" icon={<Shield className="size-4" />}>
                  Admin console
                </MenuLink>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={signOutAndLeave}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {icon}
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------- not admin */

/**
 * What a non-admin sees at an admin URL.
 *
 * <p>Says plainly that the page needs administrator access rather than
 * pretending the route does not exist. Hiding it would be security theatre --
 * the server is what refuses the data, and a vague error just makes a
 * colleague whose role was never granted think the app is broken.
 */
function NotAdmin() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-5 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-ink-faint">
        <Shield className="size-6" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-ink">Administrator access required</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Your account does not have the administrator role. If that is
          unexpected, ask an existing administrator to grant it from the user
          list.
        </p>
      </div>
      <ButtonLink href="/app" variant="secondary">
        Back to the app
      </ButtonLink>
    </main>
  );
}
