"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Monitor, Moon, Shield, Sun, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth";
import { useTheme, type Theme } from "@/lib/theme";
import { cn, formatDateTime, initials } from "@/lib/utils";

/**
 * Account settings.
 *
 * <p>Deliberately small. There is no change-password or change-email form here
 * because the backend has no endpoint for either yet, and a field that looks
 * editable but silently does nothing is worse than its absence. What is here
 * is what actually works.
 */
export default function SettingsPage() {
  const { me, isAdmin, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!me) {
    return null;
  }

  const { user, subscription } = me;

  const signOutAndLeave = async () => {
    await signOut();
    router.replace("/");
  };

  const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Settings"
        description="Your account and how MatchCV.ai looks."
      />

      {/* Identity. */}
      <Card>
        <CardHeader
          title="Account"
          description="Who you are signed in as."
          icon={<User className="size-[1.125rem]" />}
        />
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-on-brand">
              {initials(user.name, user.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-medium text-ink">
                {user.name}
              </p>
              <p className="truncate text-sm text-ink-muted">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={subscription.plan === "PRO" ? "brand" : "neutral"}>
                  {subscription.plan === "PRO" ? "Pro" : "Free"}
                </Badge>
                {isAdmin && (
                  <Badge tone="violet" icon={<Shield className="size-3" />}>
                    Administrator
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <dl className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                Member since
              </dt>
              <dd className="mt-1 text-sm text-ink">{formatDateTime(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.06em] text-ink-faint">
                Last sign-in
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {formatDateTime(user.lastLoginAt)}
              </dd>
            </div>
          </dl>

          <p className="rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-ink-muted">
            Changing your name, email or password is not available yet — those
            endpoints do not exist on the server, and a form that pretends
            otherwise would be worse than this note.
          </p>
        </CardBody>
      </Card>

      {/* Appearance. */}
      <Card>
        <CardHeader
          title="Appearance"
          description="Remembered on this device."
          icon={<Monitor className="size-[1.125rem]" />}
        />
        <CardBody>
          <div
            className="grid max-w-sm grid-cols-2 gap-3"
            role="radiogroup"
            aria-label="Theme"
          >
            {themes.map((option) => {
              const selected = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-colors",
                    selected
                      ? "border-brand-line bg-brand-soft"
                      : "border-line bg-surface-2 hover:border-line-strong",
                  )}
                >
                  <option.icon
                    className={cn("size-5", selected ? "text-brand" : "text-ink-faint")}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selected ? "text-brand" : "text-ink",
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Admin shortcut. */}
      {isAdmin && (
        <Card>
          <CardHeader
            title="Administrator"
            description="You can see and manage every account on this installation."
            icon={<Shield className="size-[1.125rem]" />}
            action={
              <ButtonLink href="/admin" variant="secondary" size="sm">
                Open the console
              </ButtonLink>
            }
          />
        </Card>
      )}

      {/* Session. */}
      <Card>
        <CardHeader
          title="Session"
          description="Signing out revokes this device's refresh token on the server, not just in this browser."
          icon={<LogOut className="size-[1.125rem]" />}
          action={
            <Button variant="danger" size="sm" onClick={() => setConfirmSignOut(true)}>
              Log out
            </Button>
          }
        />
      </Card>

      <Modal
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Log out?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmSignOut(false)}>
              Stay signed in
            </Button>
            <Button variant="danger" onClick={signOutAndLeave}>
              Log out
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          Your resumes and history stay on your account. You will need to log in
          again on this device.
        </p>
      </Modal>
    </div>
  );
}
