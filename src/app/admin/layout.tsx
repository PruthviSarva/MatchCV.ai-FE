"use client";

import { Activity, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: <Activity className="size-[1.125rem]" />,
    exact: true,
  },
  { href: "/admin/users", label: "Users", icon: <Users className="size-[1.125rem]" /> },
];

/**
 * The admin console shares the app's shell, with its own navigation and the
 * role requirement switched on.
 *
 * <p>`requireAdmin` here only decides what is rendered. Every piece of data
 * behind these screens comes from `/api/admin/**`, which the server gates on
 * ROLE_ADMIN read from the database on each request -- so this flag cannot be
 * the thing that keeps anybody out, and is not asked to be.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={NAV} requireAdmin>
      {children}
    </AppShell>
  );
}
