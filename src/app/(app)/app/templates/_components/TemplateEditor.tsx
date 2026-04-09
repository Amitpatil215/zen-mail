"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { renderLiquid } from "@/lib/templates/liquid";
import { listLiquidVariables } from "@/lib/templates/variables";
import type { TemplateDoc } from "@/lib/firestore/schema";
import { TemplateFormPanel } from "./TemplateFormPanel";
import { VariablesPanel } from "./VariablesPanel";
import { PreviewPanel } from "./PreviewPanel";

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
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoRender, setAutoRender] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const lastReqId = useRef(0);

  const requiredVars = useMemo(() => {
    const joined = `${draft.subject}\n${draft.body_html}\n${draft.body_text ?? ""}`;
    return listLiquidVariables(joined);
  }, [draft.body_html, draft.body_text, draft.subject]);

  const templateJoined = useMemo(
    () => `${draft.subject}\n${draft.body_html}\n${draft.body_text ?? ""}`,
    [draft.body_html, draft.body_text, draft.subject]
  );

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

  async function save() {
    setError(null);
    setSavedMsg(null);
    setSaving(true);
    try {
      const data = parseJsonOrThrow(sampleJson);
      await props.onSave({
        ...draft,
        sample_data: typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {},
      });
      setSavedMsg("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
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

      {savedMsg ? <div className="text-sm text-emerald-600">{savedMsg}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <TemplateFormPanel draft={draft} onChange={setDraft} />

        <div className="grid gap-4">
          <PreviewPanel
            previewDoc={previewDoc}
            theme={theme}
            onChangeTheme={setTheme}
            expanded={previewExpanded}
            onChangeExpanded={setPreviewExpanded}
          />
          <VariablesPanel
            requiredVars={requiredVars}
            templateJoined={templateJoined}
            sampleJson={sampleJson}
            onChangeSampleJson={setSampleJson}
            autoRender={autoRender}
            onChangeAutoRender={setAutoRender}
            onRenderNow={() => void doRender(false)}
            renderError={error}
          />
        </div>
      </div>
    </div>
  );
}

