"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateGroupDialog } from "./create-group-dialog";
import type { Group } from "./people-types";

type Props = {
  groups: Group[];
  filterGroupIds: string[];
  onToggleFilterGroup: (id: string) => void;
  onGroupCreated: () => void;
};

export function PeopleGroupsSection({
  groups,
  filterGroupIds,
  onToggleFilterGroup,
  onGroupCreated,
}: Props) {
  const [addGroupOpen, setAddGroupOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Groups</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Filter contacts by group (any match). Leave all unchecked to show
              everyone.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setAddGroupOpen(true)}>
            Add group
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {groups.map((g) => (
            <label
              key={g.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={filterGroupIds.includes(g.id)}
                onChange={() => onToggleFilterGroup(g.id)}
                className="rounded border-border"
              />
              {g.name}
              {g.is_default ? (
                <span className="text-muted-foreground">(default)</span>
              ) : null}
            </label>
          ))}
        </div>
      </div>

      <CreateGroupDialog
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
        onCreated={onGroupCreated}
      />
    </>
  );
}
