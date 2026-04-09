"use client";

import type { TemplateRow } from "@/lib/templates/firestoreClient";
import { Button } from "@/components/ui/button";

export function TemplateListPanel(props: {
  templates: TemplateRow[];
  selectedId: string | "new";
  setSelectedId: (id: string | "new") => void;
  error: string | null;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Your templates</div>
        <Button
          onClick={() => props.setSelectedId("new")}
          type="button"
          variant="secondary"
          disabled={props.disabled}
        >
          New
        </Button>
      </div>

      {props.error ? <div className="mt-3 text-sm text-destructive">{props.error}</div> : null}

      <div className="mt-3 grid gap-2">
        {props.templates.length ? (
          props.templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => props.setSelectedId(t.id)}
              className={[
                "w-full rounded-xl border px-3 py-2 text-left text-sm",
                props.selectedId === t.id
                  ? "border-ring bg-muted"
                  : "border-border bg-background hover:bg-muted",
              ].join(" ")}
            >
              <div className="truncate font-medium">{t.name || "Untitled"}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {new Date(t.updated_at).toLocaleString()}
              </div>
            </button>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No templates yet.</div>
        )}
      </div>
    </div>
  );
}

