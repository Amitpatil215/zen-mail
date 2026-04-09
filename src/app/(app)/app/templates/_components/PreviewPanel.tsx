"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Moon, Sun } from "lucide-react";

function OverlayModal(props: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    if (props.open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />
      <div className="absolute left-1/2 top-1/2 w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">{props.title}</div>
          <Button type="button" variant="outline" onClick={props.onClose} aria-label="Collapse preview">
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3">{props.children}</div>
      </div>
    </div>
  );
}

export function PreviewPanel(props: {
  previewDoc: string;
  theme: "light" | "dark";
  onChangeTheme: (next: "light" | "dark") => void;
  expanded: boolean;
  onChangeExpanded: (next: boolean) => void;
}) {
  return (
    <>
      <OverlayModal open={props.expanded} title="Preview" onClose={() => props.onChangeExpanded(false)}>
        <iframe
          className="h-[78vh] w-full rounded-xl border border-border bg-background"
          srcDoc={props.previewDoc}
          title="Template preview expanded"
        />
      </OverlayModal>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Preview</div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted"
              onClick={() => props.onChangeTheme("light")}
              type="button"
              aria-label="Light mode preview"
              title="Light mode"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted"
              onClick={() => props.onChangeTheme("dark")}
              type="button"
              aria-label="Dark mode preview"
              title="Dark mode"
            >
              <Moon className="h-4 w-4" />
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onChangeExpanded(true)}
              aria-label="Expand preview"
              title="Expand"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <iframe
          className="mt-3 h-[420px] w-full rounded-xl border border-border bg-background"
          srcDoc={props.previewDoc}
          title="Template preview"
        />
      </div>
    </>
  );
}

