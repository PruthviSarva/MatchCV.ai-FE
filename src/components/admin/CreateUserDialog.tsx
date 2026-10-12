"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { ErrorNote } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { ApiError, api, errorMessage, type Plan, type Role } from "@/lib/api";

/**
 * Creates an account from the console.
 *
 * <p>The administrator sets the password and passes it on out of band. There
 * is no invite email because this application has no mail transport, and a
 * "send invite" button that silently does nothing would be a far worse answer
 * than asking for a password here.
 */
export function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [plan, setPlan] = useState<Plan>("FREE");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setPlan("FREE");
    setError("");
    setFieldErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});

    try {
      const created = await api.admin.createUser({ name, email, password, role, plan });
      toast.success(`${created.user.email} created`);
      onCreated();
      close();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors);
      } else {
        setError(errorMessage(caught, "Could not create the account."));
      }
    } finally {
      setBusy(false);
    }
  };

  /**
   * A throwaway password the administrator can hand over.
   *
   * <p>From `crypto.getRandomValues`, not `Math.random` -- this string is a
   * credential, however temporary, and the difference costs one line.
   */
  const generatePassword = () => {
    const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    const generated = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join(
      "",
    );
    setPassword(generated);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      // Clipboard access can be refused outright; the field is selectable.
      toast.error("Could not copy. Select the field and copy it manually.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create an account"
      description="The person is not emailed. Give them the password yourself and ask them to change it."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" loading={busy}>
            Create account
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Name"
          required
          value={name}
          error={fieldErrors.name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Priya Sharma"
        />

        <Input
          label="Email"
          type="email"
          required
          value={email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="priya@example.com"
        />

        <div>
          <Input
            label="Password"
            required
            minLength={8}
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            icon={<KeyRound className="size-4" aria-hidden />}
            hint="8 characters minimum"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={generatePassword}
              icon={<RefreshCw className="size-3.5" />}
            >
              Generate
            </Button>
            {password && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyPassword}
                icon={<Copy className="size-3.5" />}
              >
                Copy
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            hint={role === "ADMIN" ? "Full console access" : undefined}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Administrator</option>
          </Select>

          <Select
            label="Plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value as Plan)}
          >
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
          </Select>
        </div>

        {role === "ADMIN" && (
          <p className="rounded-xl border border-[color:var(--warn)]/25 bg-warn-soft px-3.5 py-3 text-[0.8125rem] leading-relaxed text-warn">
            An administrator can see every account on this installation, change
            plans, and disable people — including you.
          </p>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}
      </form>
    </Modal>
  );
}
