"use client";

import type { TemplateDoc } from "@/lib/firestore/schema";

type Draft = Omit<TemplateDoc, "created_at" | "updated_at">;

export function TemplateFormPanel(props: {
  draft: Draft;
  onChange: (next: Draft) => void;
}) {
  const d = props.draft;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Name</div>
          <input
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={d.name}
            onChange={(e) => props.onChange({ ...d, name: e.target.value })}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground">Subject</div>
          <input
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs"
            value={d.subject}
            onChange={(e) => props.onChange({ ...d, subject: e.target.value })}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground">HTML</div>
          <textarea
            className="mt-1 h-[320px] w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={d.body_html}
            onChange={(e) => props.onChange({ ...d, body_html: e.target.value })}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground">Text (optional)</div>
          <textarea
            className="mt-1 h-28 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={d.body_text ?? ""}
            onChange={(e) => props.onChange({ ...d, body_text: e.target.value })}
          />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground">Labels (comma separated)</div>
          <input
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={d.labels.join(", ")}
            onChange={(e) =>
              props.onChange({
                ...d,
                labels: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

