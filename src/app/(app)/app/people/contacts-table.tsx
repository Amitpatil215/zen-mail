"use client";

import { Button } from "@/components/ui/button";
import type { Group, Person } from "./people-types";
import { personSubscriptionDetail, personSubscriptionSummary } from "./person-subscription-label";

function groupLabel(groups: Group[], id: string) {
  return groups.find((g) => g.id === id)?.name ?? id.slice(0, 6);
}

type Props = {
  people: Person[];
  groups: Group[];
  onEdit: (p: Person) => void;
};

export function ContactsTable({ people, groups, onEdit }: Props) {
  if (!people.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No contacts on this page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Groups</th>
            <th className="px-4 py-3 font-medium">Unsubscribe</th>
            <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p, i) => (
            <tr
              key={p.id}
              className={
                i % 2 === 0
                  ? "border-b border-border bg-background"
                  : "border-b border-border bg-muted/20"
              }
            >
              <td className="max-w-[220px] px-4 py-3 font-medium">
                <span className="block truncate" title={p.email}>
                  {p.email}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {p.first_name || p.last_name
                  ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex max-w-xs flex-wrap gap-1">
                  {(p.group_ids ?? []).length ? (
                    (p.group_ids ?? []).map((id) => (
                      <span
                        key={id}
                        className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {groupLabel(groups, id)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </td>
              <td
                className="max-w-[200px] px-4 py-3 text-xs text-muted-foreground"
                title={personSubscriptionDetail(p)}
              >
                <span
                  className={
                    p.unsubscribed_at
                      ? "font-medium text-destructive"
                      : Object.keys(p.unsubscribed_from ?? {}).length
                        ? "font-medium text-amber-700 dark:text-amber-500"
                        : ""
                  }
                >
                  {personSubscriptionSummary(p)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onEdit(p)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
