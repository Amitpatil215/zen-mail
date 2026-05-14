"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!person) return;
    setEmail(person.email);
    setFirst(person.first_name ?? "");
    setLast(person.last_name ?? "");
    setGroupIds(person.group_ids ?? []);
    setError(null);
  }, [person]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit contact</DialogTitle>
        <DialogDescription>
          Update email, name, and group membership for this person.
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
        </div>

        {error ? (
          <div className="text-xs text-destructive">{error}</div>
        ) : null}

        <div className="flex justify-end gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
