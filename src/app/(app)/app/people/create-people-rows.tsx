"use client";

import { Button } from "@/components/ui/button";

export type PersonDraftRow = { email: string; first_name: string; last_name: string };

type Props = {
  rows: PersonDraftRow[];
  onChange: (rows: PersonDraftRow[]) => void;
};

export function CreatePeopleRows({ rows, onChange }: Props) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">People</div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() =>
            onChange([...rows, { email: "", first_name: "", last_name: "" }])
          }
        >
          Add row
        </Button>
      </div>
      <div className="grid max-h-48 gap-2 overflow-y-auto">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-xl border border-border bg-background p-2 sm:grid-cols-3"
          >
            <input
              className="h-9 rounded-lg border border-border px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:col-span-3"
              placeholder="Email"
              value={row.email}
              onChange={(e) =>
                onChange(
                  rows.map((x, j) => (j === i ? { ...x, email: e.target.value } : x))
                )
              }
            />
            <input
              className="h-9 rounded-lg border border-border px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              placeholder="First name"
              value={row.first_name}
              onChange={(e) =>
                onChange(
                  rows.map((x, j) =>
                    j === i ? { ...x, first_name: e.target.value } : x
                  )
                )
              }
            />
            <input
              className="h-9 rounded-lg border border-border px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:col-span-2"
              placeholder="Last name"
              value={row.last_name}
              onChange={(e) =>
                onChange(
                  rows.map((x, j) =>
                    j === i ? { ...x, last_name: e.target.value } : x
                  )
                )
              }
            />
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="sm:col-span-3"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
              >
                Remove row
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
