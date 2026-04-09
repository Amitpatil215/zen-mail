"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { findMissingLiquidVariables, listLiquidVariables } from "@/lib/templates/variables";
import { populateSampleDataJson } from "@/lib/templates/sampleData";

const example = `<!-- HTML template -->\n<h1>Hello {{ person.first_name }}</h1>\n<p>Welcome to Zen Mail.</p>\n`;

export default function TemplatesPage() {
  const [body, setBody] = useState(example);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [sampleJson, setSampleJson] = useState(
    JSON.stringify({ person: { first_name: "Taylor" } }, null, 2)
  );
  const [rendered, setRendered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRequired, setLastRequired] = useState<string[] | null>(null);
  const [lastMissing, setLastMissing] = useState<string[] | null>(null);
  const lastReqId = useRef(0);
  const [autoRender, setAutoRender] = useState(true);

  const previewDoc = useMemo(() => {
    const bg = mode === "dark" ? "#111" : "#fff";
    const fg = mode === "dark" ? "#f4f4f5" : "#111";
    const html = rendered ?? body;
    const looksLikeFullDocument = /<!doctype/i.test(html) || /<html[\s>]/i.test(html);
    if (looksLikeFullDocument) return html;
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
  }, [body, mode, rendered]);

  async function renderPreview(opts?: { silent?: boolean }) {
    setError(null);
    setRendered(null);
    setLastRequired(null);
    setLastMissing(null);
    try {
      const tenantId = getActiveTenantId();
      if (!tenantId) throw new Error("No active tenant selected.");
      const { getClientAuth } = await import("@/lib/firebase/client");
      const token = await getClientAuth().currentUser?.getIdToken();
      if (!token) throw new Error("Not signed in.");

      let data: unknown;
      try {
        data = JSON.parse(sampleJson || "{}");
      } catch {
        throw new Error("Sample data must be valid JSON.");
      }

      // Immediate local diagnostics (fast feedback even if request fails).
      setLastRequired(listLiquidVariables(body));
      setLastMissing(findMissingLiquidVariables(body, data));

      const reqId = ++lastReqId.current;
      const res = await fetch("/api/templates/render", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ html: body, data, strict: false }),
      });
      if (!res.ok) throw new Error(await res.text());
      const out = (await res.json()) as {
        html: string;
        required_vars?: string[];
        missing_vars?: string[];
      };
      if (reqId !== lastReqId.current) return;
      setRendered(out.html);
      if (out.required_vars) setLastRequired(out.required_vars);
      if (out.missing_vars) setLastMissing(out.missing_vars);
    } catch (e) {
      if (opts?.silent) return;
      setError(e instanceof Error ? e.message : "Failed to render template.");
    }
  }

  function populateJsonFromRequiredVars() {
    const required = lastRequired ?? listLiquidVariables(body);
    if (!required.length) return;
    let existing: unknown = {};
    try {
      existing = JSON.parse(sampleJson || "{}");
    } catch {
      existing = {};
    }
    const out = populateSampleDataJson({ requiredVars: required, existingData: existing });
    setSampleJson(JSON.stringify(out, null, 2));
  }

  useEffect(() => {
    if (!autoRender) return;
    // Debounce while typing.
    const t = window.setTimeout(() => {
      void renderPreview({ silent: true });
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRender, body, sampleJson]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and preview templates with sample variables (Liquid).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Editor</div>
            <div className="text-xs text-muted-foreground">
              Handlebars-like syntax
            </div>
          </div>
          <textarea
            className="mt-3 h-[420px] w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="mt-3 grid gap-2">
            <div className="text-xs font-medium text-muted-foreground">
              Sample data (JSON)
            </div>
            <textarea
              className="h-40 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={sampleJson}
              onChange={(e) => setSampleJson(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button onClick={() => renderPreview()} type="button">
                Render now
              </Button>
              <Button onClick={populateJsonFromRequiredVars} type="button" variant="secondary">
                Populate JSON
              </Button>
              <Button
                onClick={() => {
                  setRendered(null);
                  setError(null);
                  setLastRequired(null);
                  setLastMissing(null);
                }}
                type="button"
                variant="outline"
              >
                Reset
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
            {error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : null}
            {lastRequired?.length ? (
              <div className="mt-3 rounded-xl border border-border bg-background p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Required variables
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lastRequired.map((v) => (
                    <span
                      key={v}
                      className="rounded-lg border border-border px-2 py-0.5 text-[11px]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                {lastMissing?.length ? (
                  <div className="mt-2 text-xs text-destructive">
                    Missing: {lastMissing.join(", ")}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-emerald-600">All present.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Preview</div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted"
                onClick={() => setMode("light")}
                type="button"
              >
                Light
              </button>
              <button
                className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted"
                onClick={() => setMode("dark")}
                type="button"
              >
                Dark
              </button>
            </div>
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

