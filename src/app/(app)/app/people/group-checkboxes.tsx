"use client";

import type { Group } from "./people-types";

type Props = {
  groups: Group[];
  value: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
};

export function GroupCheckboxes({ groups, value, onChange, idPrefix }: Props) {
  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border bg-background p-2">
      {groups.map((g) => (
        <label
          key={g.id}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-muted"
        >
          <input
            id={`${idPrefix}-${g.id}`}
            type="checkbox"
            checked={value.includes(g.id)}
            onChange={() => toggle(g.id)}
            className="rounded border-border"
          />
          <span>
            {g.name}
            {g.is_default ? (
              <span className="text-muted-foreground"> (default)</span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}
