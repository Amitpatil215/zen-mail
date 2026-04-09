"use client";

import { useMemo } from "react";

export function TemplatePreviewPanel(props: {
  mode: "light" | "dark";
  setMode: (m: "light" | "dark") => void;
  renderedHtml: string | null;
  fallbackHtml: string;
}) {
  const previewDoc = useMemo(() => {
    const bg = props.mode === "dark" ? "#111" : "#fff";
    const fg = props.mode === "dark" ? "#f4f4f5" : "#111";
    const html = props.renderedHtml ?? props.fallbackHtml;
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
  }, [props.fallbackHtml, props.mode, props.renderedHtml]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Preview</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => props.setMode("light")}
            type="button"
          >
            Light
          </button>
          <button
            className="rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => props.setMode("dark")}
            type="button"
          >
            Dark
          </button>
        </div>
      </div>
      <iframe
        className="mt-3 h-[560px] w-full rounded-xl border border-border bg-background"
        srcDoc={previewDoc}
        title="Template preview"
      />
    </div>
  );
}

