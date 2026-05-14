"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { peopleAuthedFetch } from "./people-fetch";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function CreateGroupDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setName("");
    setErr(null);
  }

  async function submit() {
    const n = name.trim();
    if (!n) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await peopleAuthedFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: n }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated();
      reset();
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create group.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogTitle>Add group</DialogTitle>
        <DialogDescription>
          Create a new group for this workspace. People can belong to multiple
          groups.
        </DialogDescription>
        <input
          className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Newsletter, VIP, Trial users"
          autoFocus
        />
        {err ? <p className="text-xs text-destructive">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!name.trim() || busy} onClick={submit}>
            {busy ? "Creating…" : "Create group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
