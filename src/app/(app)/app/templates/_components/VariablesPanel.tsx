"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { findMissingLiquidVariables } from "@/lib/templates/variables";
import { populateSampleDataJson } from "@/lib/templates/sampleData";

export function VariablesPanel(props: {
  requiredVars: string[];
  templateJoined: string;
  sampleJson: string;
  onChangeSampleJson: (next: string) => void;
  autoRender: boolean;
  onChangeAutoRender: (next: boolean) => void;
  onRenderNow: () => void;
  renderError: string | null;
}) {
  const [open, setOpen] = useState(false);

  const missingVars = useMemo(() => {
    try {
      const data = JSON.parse(props.sampleJson || "{}");
      return findMissingLiquidVariables(props.templateJoined, data);
    } catch {
      return props.requiredVars;
    }
  }, [props.requiredVars, props.sampleJson, props.templateJoined]);

  function populateJson() {
    let existing: unknown = {};
    try {
      existing = JSON.parse(props.sampleJson || "{}");
    } catch {
      existing = {};
    }
    const out = populateSampleDataJson({ requiredVars: props.requiredVars, existingData: existing });
    props.onChangeSampleJson(JSON.stringify(out, null, 2));
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Variables</div>
        <div className="flex items-center gap-2">
          <Button onClick={props.onRenderNow} type="button" variant="outline">
            Render now
          </Button>
          <Button onClick={populateJson} type="button" variant="secondary">
            Populate JSON
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">Sample data (JSON)</div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={props.autoRender}
              onChange={(e) => props.onChangeAutoRender(e.target.checked)}
            />
            Auto-render
          </label>
        </div>
        <textarea
          className="h-44 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={props.sampleJson}
          onChange={(e) => props.onChangeSampleJson(e.target.value)}
        />

        {props.renderError ? <div className="text-sm text-destructive">{props.renderError}</div> : null}

        {missingVars.length ? (
          <div className="text-xs text-destructive">Missing: {missingVars.join(", ")}</div>
        ) : props.requiredVars.length ? (
          <div className="text-xs text-emerald-600">All required variables present.</div>
        ) : null}

        {props.requiredVars.length ? (
          <div className="rounded-xl border border-border bg-background p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setOpen((v) => !v)}
            >
              <div className="text-xs font-medium text-muted-foreground">Required variables</div>
              <div className="text-xs text-muted-foreground">{open ? "Collapse" : "Expand"}</div>
            </button>
            {open ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {props.requiredVars.map((v) => (
                  <span key={v} className="rounded-lg border border-border px-2 py-0.5 text-[11px]">
                    {v}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

