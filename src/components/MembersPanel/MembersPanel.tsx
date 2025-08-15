"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { removeMember, setMemberRole } from "@/lib/firestore";

type Role = "admin" | "viewer";

interface Props {
  listId: string;
  ownerEmail: string;
  members: Record<string, Role>;
  canAdmin: boolean;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const MembersPanel: React.FC<Props> = ({
  listId,
  ownerEmail,
  members,
  canAdmin,
}) => {
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const membersArray = useMemo(
    () =>
      Object.entries(members ?? {}).map(([email, role]) => ({
        email,
        role,
        isOwner: email === ownerEmail,
      })),
    [members, ownerEmail]
  );

  async function handleInvite() {
    const email = normalizeEmail(inviteEmail);
    if (!email) {
      return;
    }
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    setIsSubmitting(true);
    try {
      await setMemberRole(listId, email, inviteRole);
      toast.success("Member added");
      setInviteEmail("");
      setInviteRole("viewer");
    } catch {
      toast.error("Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangeRole(email: string, role: Role) {
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    const normalized = normalizeEmail(email);
    if (normalized === ownerEmail && role !== "admin") {
      toast.error("Owner must remain admin");
      return;
    }
    try {
      await setMemberRole(listId, normalized, role);
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleRemoveMember(email: string) {
    if (!canAdmin) {
      toast.error("Not allowed");
      return;
    }
    const normalized = normalizeEmail(email);
    if (normalized === ownerEmail) {
      toast.error("Cannot remove owner");
      return;
    }
    try {
      await removeMember(listId, normalized);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded border p-3">
      {canAdmin ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            className="sm:max-w-xs"
            disabled={isSubmitting}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as Role)}
            disabled={isSubmitting}
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={handleInvite}
            disabled={isSubmitting || !inviteEmail.trim()}
          >
            Add member
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You can view members only
        </p>
      )}

      <ul className="space-y-2">
        {membersArray.map(({ email, role, isOwner }) => (
          <li
            key={email}
            className="flex items-center justify-between rounded border p-2"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{email}</span>
              <span className="text-xs text-muted-foreground">
                {isOwner ? "owner" : role}
              </span>
            </div>

            {canAdmin && !isOwner ? (
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border px-2 py-1 text-sm"
                  value={role}
                  onChange={(event) =>
                    handleChangeRole(email, event.target.value as Role)
                  }
                  disabled={isSubmitting}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${email}`}
                  onClick={() => handleRemoveMember(email)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div />
            )}
          </li>
        ))}
        {!!membersArray.length && (
          <p className="text-sm text-muted-foreground">No members yet</p>
        )}
      </ul>
    </div>
  );
};
