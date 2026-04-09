"use client";

import { Button } from "@/components/ui/button";

export function TemplateEditorPanel(props: {
  name: string;
  setName: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  labels: string;
  setLabels: (v: string) => void;
  bodyHtml: string;
  setBodyHtml: (v: string) => void;
  bodyText: string;
  setBodyText: (v: string) => void;
  sampleJson: string;
  setSampleJson: (v: string) => void;
  error: string | null;
  requiredVars: string[];
  missingVars: string[];
  autoRender: boolean;
  setAutoRender: (v: boolean) => void;
  busy: null | "saving" | "deleting";
  canDelete: boolean;
  onRenderNow: () => void;
  onPopulateJson: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Editor</div>
        <div className="text-xs text-muted-foreground">Liquid syntax</div>
      </div>

      <div className="mt-3 grid gap-3">
        <input
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          placeholder="Template name"
        />
        <input
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={props.subject}
          onChange={(e) => props.setSubject(e.target.value)}
          placeholder="Subject (Liquid supported)"
        />
        <input
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={props.labels}
          onChange={(e) => props.setLabels(e.target.value)}
          placeholder="Labels (comma-separated)"
        />
      </div>

      <textarea
        className="mt-3 h-[260px] w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        value={props.bodyHtml}
        onChange={(e) => props.setBodyHtml(e.target.value)}
      />

      <textarea
        className="mt-3 h-[110px] w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        value={props.bodyText}
        onChange={(e) => props.setBodyText(e.target.value)}
        placeholder="Optional text version"
      />

      <div className="mt-3 grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Sample data (JSON)</div>
        <textarea
          className="h-44 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={props.sampleJson}
          onChange={(e) => props.setSampleJson(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={props.onRenderNow} type="button">
            Render now
          </Button>
          <Button onClick={props.onPopulateJson} type="button" variant="secondary">
            Populate JSON
          </Button>
          <Button onClick={props.onSave} type="button" disabled={props.busy !== null}>
            {props.busy === "saving" ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={props.onDelete}
            type="button"
            variant="outline"
            disabled={props.busy !== null || !props.canDelete}
          >
            {props.busy === "deleting" ? "Deleting..." : "Delete"}
          </Button>

          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={props.autoRender}
              onChange={(e) => props.setAutoRender(e.target.checked)}
            />
            Auto-render
          </label>
        </div>

        {props.error ? <div className="text-sm text-destructive">{props.error}</div> : null}

        {props.requiredVars.length ? (
          <div className="mt-1 rounded-xl border border-border bg-background p-3">
            <div className="text-xs font-medium text-muted-foreground">Required variables</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {props.requiredVars.map((v) => (
                <span key={v} className="rounded-lg border border-border px-2 py-0.5 text-[11px]">
                  {v}
                </span>
              ))}
            </div>
            {props.missingVars.length ? (
              <div className="mt-2 text-xs text-destructive">
                Missing: {props.missingVars.join(", ")}
              </div>
            ) : (
              <div className="mt-2 text-xs text-emerald-600">All present.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

