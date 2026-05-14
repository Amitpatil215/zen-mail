"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/app/(app)/app/templates/_components/ConfirmDialog";
import { EditPersonSubscriptionSection } from "./edit-person-subscription-section";
import { GroupCheckboxes } from "./group-checkboxes";
import type { Group, Person } from "./people-types";
import { peopleAuthedFetch } from "./people-fetch";

type Props = {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  onSaved: () => void;
};

export function EditPersonDialog({
  person,
  open,
  onOpenChange,
  groups,
  onSaved,
}: Props) {
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [globalUnsub, setGlobalUnsub] = useState(false);
  const [fromMap, setFromMap] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const deleteInFlight = useRef(false);

  useEffect(() => {
    if (!person) return;
    setEmail(person.email);
    setFirst(person.first_name ?? "");
    setLast(person.last_name ?? "");
    setGroupIds(person.group_ids ?? []);
    setGlobalUnsub(Boolean(person.unsubscribed_at));
    setFromMap({ ...(person.unsubscribed_from ?? {}) });
    setError(null);
    setDeleteConfirmOpen(false);
  }, [person]);

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false);
  }, [open]);

  async function save() {
    if (!person) return;
    setError(null);
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    const defaultId = groups.find((g) => g.is_default)?.id ?? groups[0]?.id;
    const gids = groupIds.length ? groupIds : defaultId ? [defaultId] : [];
    if (!gids.length) {
      setError("Select at least one group.");
      return;
    }
    setLoading(true);
    try {
      const res = await peopleAuthedFetch(`/api/people/${person.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          email: email.trim(),
          first_name: first.trim() || undefined,
          last_name: last.trim() || undefined,
          group_ids: gids,
          unsubscribed_at: globalUnsub ? (person.unsubscribed_at ?? Date.now()) : null,
          unsubscribed_from: fromMap,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!person || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setError(null);
    try {
      const res = await peopleAuthedFetch(`/api/people/${person.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setDeleteConfirmOpen(false);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setDeleteConfirmOpen(false);
      setError(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      deleteInFlight.current = false;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit contact</DialogTitle>
        <DialogDescription>
          Update email, name, groups, and subscription / unsubscribe preferences for this person.
        </DialogDescription>

        <div className="grid gap-3">
          <input
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="First name"
            />
            <input
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Last name"
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Groups
            </div>
            <GroupCheckboxes
              groups={groups}
              value={groupIds}
              onChange={setGroupIds}
              idPrefix="edit"
            />
          </div>
          <EditPersonSubscriptionSection
            globalUnsub={globalUnsub}
            onGlobalUnsubChange={setGlobalUnsub}
            fromKeys={Object.keys(fromMap).sort()}
            onRemoveSender={(key) => {
              setFromMap((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }}
            onClearAllSenders={() => setFromMap({})}
          />
        </div>

        {error ? (
          <div className="text-xs text-destructive">{error}</div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!person || loading}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={loading || !person}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete this contact?"
          description={
            person
              ? `Remove ${person.email} from your audience. This cannot be undone.`
              : undefined
          }
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={() => void confirmDelete()}
        />
      </DialogContent>
    </Dialog>
  );
}
