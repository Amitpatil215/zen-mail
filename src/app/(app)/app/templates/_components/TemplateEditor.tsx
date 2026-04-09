"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { renderLiquid } from "@/lib/templates/liquid";
import { findMissingLiquidVariables, listLiquidVariables } from "@/lib/templates/variables";
import { populateSampleDataJson } from "@/lib/templates/sampleData";
import type { TemplateDoc } from "@/lib/firestore/schema";

type Draft = Omit<TemplateDoc, "created_at" | "updated_at">;

function parseJsonOrThrow(text: string): unknown {
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new Error("Sample data must be valid JSON.");
  }
}

export function TemplateEditor(props: {
  initial: Draft;
  mode: "create" | "edit";
  onSave: (draft: Draft) => Promise<void>;
  onCancelHref: string;
}) {
  const [draft, setDraft] = useState<Draft>(props.initial);
  const [sampleJson, setSampleJson] = useState(JSON.stringify(props.initial.sample_data ?? {}, null, 2));
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoRender, setAutoRender] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const lastReqId = useRef(0);

  const requiredVars = useMemo(() => {
    const joined = `${draft.subject}\n${draft.body_html}\n${draft.body_text ?? ""}`;
    return listLiquidVariables(joined);
  }, [draft.body_html, draft.body_text, draft.subject]);

  const previewDoc = useMemo(() => {
    const html = renderedHtml ?? draft.body_html;
    const looksLikeFullDocument = /<!doctype/i.test(html) || /<html[\s>]/i.test(html);
    if (looksLikeFullDocument) return html;
    const bg = theme === "dark" ? "#111" : "#fff";
    const fg = theme === "dark" ? "#f4f4f5" : "#111";
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; padding: 24px; background: ${bg}; color: ${fg}; font-family: ui-sans-serif, system-ui; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
  }, [draft.body_html, renderedHtml, theme]);

  async function doRender(silent?: boolean) {
    setError(null);
    const reqId = ++lastReqId.current;
    try {
      const data = parseJsonOrThrow(sampleJson);
      const html = await renderLiquid(draft.body_html, data);
      if (reqId !== lastReqId.current) return;
      setRenderedHtml(html);
    } catch (e) {
      if (silent) return;
      setError(e instanceof Error ? e.message : "Failed to render template.");
    }
  }

  useEffect(() => {
    if (!autoRender) return;
    const t = window.setTimeout(() => void doRender(true), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRender, draft.body_html, sampleJson]);

  const missingVars = useMemo(() => {
    try {
      const data = JSON.parse(sampleJson || "{}");
      const joined = `${draft.subject}\n${draft.body_html}\n${draft.body_text ?? ""}`;
      return findMissingLiquidVariables(joined, data);
    } catch {
      return requiredVars;
    }
  }, [draft.body_html, draft.body_text, draft.subject, requiredVars, sampleJson]);

  function populateJson() {
    let existing: unknown = {};
    try {
      existing = JSON.parse(sampleJson || "{}");
    } catch {
      existing = {};
    }
    const out = populateSampleDataJson({ requiredVars, existingData: existing });
    setSampleJson(JSON.stringify(out, null, 2));
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const data = parseJsonOrThrow(sampleJson);
      await props.onSave({
        ...draft,
        sample_data: typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {},
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {props.mode === "create" ? "New template" : "Edit template"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Stored in Firestore per tenant.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={props.onCancelHref} className="text-sm text-muted-foreground hover:underline">
            Back
          </a>
          <Button onClick={save} disabled={saving || !draft.name.trim() || !draft.subject.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Name</div>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Subject</div>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs"
                value={draft.subject}
                onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">HTML</div>
              <textarea
                className="mt-1 h-[320px] w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={draft.body_html}
                onChange={(e) => setDraft((d) => ({ ...d, body_html: e.target.value }))}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Text (optional)</div>
              <textarea
                className="mt-1 h-28 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={draft.body_text ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, body_text: e.target.value }))}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Labels (comma separated)</div>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={draft.labels.join(", ")}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    labels: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Preview</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted"
                onClick={() => setTheme("light")}
                type="button"
              >
                Light
              </button>
              <button
                className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted"
                onClick={() => setTheme("dark")}
                type="button"
              >
                Dark
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            <div className="flex items-center gap-2">
              <Button onClick={() => void doRender(false)} type="button">
                Render now
              </Button>
              <Button onClick={populateJson} type="button" variant="secondary">
                Populate JSON
              </Button>
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoRender}
                  onChange={(e) => setAutoRender(e.target.checked)}
                />
                Auto-render
              </label>
            </div>
            <div className="text-xs font-medium text-muted-foreground">Sample data (JSON)</div>
            <textarea
              className="h-44 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={sampleJson}
              onChange={(e) => setSampleJson(e.target.value)}
            />
            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            {requiredVars.length ? (
              <div className="rounded-xl border border-border bg-background p-3">
                <div className="text-xs font-medium text-muted-foreground">Required variables</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {requiredVars.map((v) => (
                    <span key={v} className="rounded-lg border border-border px-2 py-0.5 text-[11px]">
                      {v}
                    </span>
                  ))}
                </div>
                {missingVars.length ? (
                  <div className="mt-2 text-xs text-destructive">Missing: {missingVars.join(", ")}</div>
                ) : (
                  <div className="mt-2 text-xs text-emerald-600">All present.</div>
                )}
              </div>
            ) : null}
          </div>

          <iframe
            className="mt-3 h-[420px] w-full rounded-xl border border-border bg-background"
            srcDoc={previewDoc}
            title="Template preview"
          />
        </div>
      </div>
    </div>
  );
}

