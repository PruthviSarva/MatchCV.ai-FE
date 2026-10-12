"use client";

import {
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  Wand2,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";

/**
 * Navigation for the signed-in app.
 *
 * <p>Ordered by how often each is reached, not alphabetically: the dashboard
 * and the thing the product actually does come first, and the account screens
 * sit at the bottom where people expect to find them.
 */
const NAV: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    icon: <LayoutDashboard className="size-[1.125rem]" />,
    // Without this, every /app/* route would light up the dashboard as well.
    exact: true,
  },
  { href: "/app/tailor", label: "Tailor a resume", icon: <Wand2 className="size-[1.125rem]" /> },
  { href: "/app/history", label: "History", icon: <History className="size-[1.125rem]" /> },
  { href: "/app/resumes", label: "My resumes", icon: <FileText className="size-[1.125rem]" /> },
  { href: "/app/billing", label: "Plan & usage", icon: <CreditCard className="size-[1.125rem]" /> },
  { href: "/app/settings", label: "Settings", icon: <Settings className="size-[1.125rem]" /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell nav={NAV}>{children}</AppShell>;
}
