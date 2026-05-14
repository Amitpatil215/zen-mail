"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatePeopleRows, type PersonDraftRow } from "./create-people-rows";
import { GroupCheckboxes } from "./group-checkboxes";
import type { Group } from "./people-types";
import { peopleAuthedFetch } from "./people-fetch";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  onCreated: () => void;
};

export function CreatePeopleDialog({
  open,
  onOpenChange,
  groups,
  onCreated,
}: Props) {
  const defaultGroupId = useMemo(
    () => groups.find((g) => g.is_default)?.id ?? groups[0]?.id ?? "",
    [groups]
  );
  const [rows, setRows] = useState<PersonDraftRow[]>([
    { email: "", first_name: "", last_name: "" },
  ]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveGroups =
    groupIds.length > 0 ? groupIds : defaultGroupId ? [defaultGroupId] : [];

  function reset() {
    setRows([{ email: "", first_name: "", last_name: "" }]);
    setGroupIds([]);
    setError(null);
  }

  async function submit() {
    setError(null);
    const people = rows
      .map((r) => ({
        email: r.email.trim(),
        first_name: r.first_name.trim() || undefined,
        last_name: r.last_name.trim() || undefined,
      }))
      .filter((r) => r.email);
    if (!people.length) {
      setError("Add at least one email.");
      return;
    }
    if (!effectiveGroups.length) {
      setError("No groups available. Create a tenant or refresh.");
      return;
    }
    setLoading(true);
    try {
      const res = await peopleAuthedFetch("/api/people", {
        method: "POST",
        body: JSON.stringify({
          people,
          group_ids: effectiveGroups,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated();
      reset();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create.");
    } finally {
      setLoading(false);
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
      <DialogContent className="w-[min(100%-2rem,36rem)] max-h-[90vh] overflow-y-auto">
        <DialogTitle>Add people</DialogTitle>
        <DialogDescription>
          Add one or more contacts and assign them to groups. If you pick no
          groups, the default group is used.
        </DialogDescription>

        <div className="grid gap-2">
          <div className="text-xs font-medium text-muted-foreground">Groups</div>
          <GroupCheckboxes
            groups={groups}
            value={groupIds}
            onChange={setGroupIds}
            idPrefix="create"
          />
        </div>

        <CreatePeopleRows rows={rows} onChange={setRows} />

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
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
