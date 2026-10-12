"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, SectionHeading } from "@/components/ui/Card";
import { EmptyState, ErrorNote, Skeleton } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth";
import {
  api,
  errorMessage,
  type AdminUserPage,
  type AdminUserSummary,
  type Role,
} from "@/lib/api";
import { cn, initials, relativeTime } from "@/lib/utils";

type StatusFilter = "all" | "active" | "disabled";
type RoleFilter = "all" | Role;

const PAGE_SIZE = 20;

/**
 * Every account, searchable and filterable.
 *
 * <p>Paged on the server rather than in the browser. Unlike a single user's
 * own history, this list grows without bound, and a console that fetches every
 * account to filter three of them is the thing that falls over first on the
 * installation that actually got used.
 */
export default function AdminUsersPage() {
  const { me, refresh } = useAuth();
  const [data, setData] = useState<AdminUserPage | null>(null);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [role, setRole] = useState<RoleFilter>("all");
  const [page, setPage] = useState(0);

  const [creating, setCreating] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<AdminUserSummary | null>(null);
  const [working, setWorking] = useState(false);

  // Typing fires a request per keystroke otherwise. 300ms is long enough to
  // collapse a burst of typing and short enough not to feel laggy.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Bumped after any change that alters the list. Having it among the
  // effect's dependencies keeps fetching in exactly one place, instead of a
  // loader function called from both a handler and an effect.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await api.admin.users({
          query: debouncedQuery || undefined,
          active: status === "all" ? undefined : status === "active",
          role: role === "all" ? undefined : role,
          page,
          size: PAGE_SIZE,
        });
        if (cancelled) {
          return;
        }
        setData(loaded);
        setError("");
      } catch (caught) {
        if (!cancelled) {
          setError(errorMessage(caught, "Could not load the user list."));
        }
      }
    })();
    return () => {
      // A filter changed while this was in flight; its result is stale.
      cancelled = true;
    };
  }, [debouncedQuery, status, role, page, reloadToken]);

  const setActive = async (user: AdminUserSummary, active: boolean) => {
    setWorking(true);
    try {
      await api.admin.setActive(user.id, active);
      toast.success(active ? `${user.name} re-enabled` : `${user.name} disabled`);
      setPendingDisable(null);
      reload();
    } catch (caught) {
      // The server refuses self-lockout and last-admin removal with a 400 and
      // a message that explains which. Surfacing it verbatim is the whole
      // point of writing those messages carefully.
      toast.error(errorMessage(caught, "Could not change that account."));
    } finally {
      setWorking(false);
    }
  };

  const changeRole = async (user: AdminUserSummary, nextRole: Role) => {
    setWorking(true);
    try {
      await api.admin.setRole(user.id, nextRole);
      toast.success(
        nextRole === "ADMIN"
          ? `${user.name} is now an administrator`
          : `${user.name} is now an ordinary user`,
      );
      // Demoting yourself is refused by the server, but promoting someone else
      // can still change what this session is told about itself on reload.
      if (user.id === me?.user.id) {
        await refresh();
      }
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not change that role."));
    } finally {
      setWorking(false);
    }
  };

  const filtersActive = debouncedQuery !== "" || status !== "all" || role !== "all";

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Users"
        description="Every account on this installation. Search, change plans and roles, or disable access."
        action={
          <Button onClick={() => setCreating(true)} icon={<UserPlus className="size-4" />}>
            New user
          </Button>
        }
      />

      {error && <ErrorNote>{error}</ErrorNote>}

      {/* Filters. */}
      <Card>
        {/*
          A grid rather than a flex row with a width on each control. Every
          field in this app is 100% of whatever contains it, so sizing them
          individually means fighting that rule; giving the container the
          track sizes instead lets each one simply fill its own cell, and the
          single column below the sm breakpoint falls out for free.
        */}
        <CardBody className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-end">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            icon={<Search className="size-4" aria-hidden />}
            aria-label="Search users"
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(0);
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
          <Select
            label="Role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as RoleFilter);
              setPage(0);
            }}
          >
            <option value="all">All</option>
            <option value="USER">User</option>
            <option value="ADMIN">Administrator</option>
          </Select>
        </CardBody>
      </Card>

      {/* The table. */}
      {!data ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={filtersActive ? "No accounts match" : "No accounts yet"}
          description={
            filtersActive
              ? "Try a different search, or clear the filters."
              : "Accounts appear here as people sign up, or when you create one."
          }
          action={
            filtersActive ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setRole("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreating(true)}>
                Create the first account
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* One scroll container, so a narrow screen scrolls the table rather
              than the whole page sideways. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.06em] text-ink-faint">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Plan
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Resumes
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Rewrites
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Last seen
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => {
                  const isSelf = user.id === me?.user.id;
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-line last:border-0 transition-colors hover:bg-surface-2",
                        !user.active && "opacity-60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-[0.6875rem] font-bold text-ink-muted">
                            {initials(user.name, user.email)}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-ink">
                                {user.name}
                              </span>
                              {isSelf && <Badge>You</Badge>}
                              {user.role === "ADMIN" && (
                                <Badge tone="violet" icon={<Shield className="size-3" />}>
                                  Admin
                                </Badge>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-ink-faint">
                              {user.email}
                            </span>
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={user.active ? "brand" : "danger"} dot>
                          {user.active ? "Active" : "Disabled"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={user.plan === "PRO" ? "brand" : "neutral"}>
                          {user.plan === "PRO" ? "Pro" : "Free"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ink-muted">
                        {user.resumeCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ink-muted">
                        {user.tailoringCount}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-faint">
                        {user.lastLoginAt ? relativeTime(user.lastLoginAt) : "never"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={working || isSelf}
                            title={
                              isSelf
                                ? "You cannot change your own role"
                                : user.role === "ADMIN"
                                  ? "Remove administrator access"
                                  : "Make an administrator"
                            }
                            onClick={() =>
                              changeRole(user, user.role === "ADMIN" ? "USER" : "ADMIN")
                            }
                          >
                            {user.role === "ADMIN" ? "Demote" : "Make admin"}
                          </Button>

                          {user.active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={working || isSelf}
                              title={
                                isSelf
                                  ? "You cannot disable your own account"
                                  : "Disable this account"
                              }
                              onClick={() => setPendingDisable(user)}
                              className="text-ink-faint hover:text-danger"
                              icon={<UserX className="size-4" />}
                            >
                              Disable
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={working}
                              onClick={() => setActive(user, true)}
                              className="text-brand"
                              icon={<UserCheck className="size-4" />}
                            >
                              Enable
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination. */}
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-[0.8125rem] text-ink-muted">
              {data.totalItems === 0
                ? "No accounts"
                : `${data.page * data.size + 1}-${Math.min(
                    (data.page + 1) * data.size,
                    data.totalItems,
                  )} of ${data.totalItems}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={data.page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                icon={<ChevronLeft className="size-4" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={data.page + 1 >= data.totalPages}
                onClick={() => setPage((current) => current + 1)}
                iconRight={<ChevronRight className="size-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      <CreateUserDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={reload}
      />

      <Modal
        open={pendingDisable !== null}
        onClose={() => setPendingDisable(null)}
        title="Disable this account?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDisable(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={working}
              onClick={() => pendingDisable && setActive(pendingDisable, false)}
            >
              Disable account
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{pendingDisable?.name}</span> is
          signed out immediately — the session they are holding right now stops
          working on its next request, not when its token expires. Nothing is
          deleted, and enabling the account again restores everything.
        </p>
      </Modal>
    </div>
  );
}
