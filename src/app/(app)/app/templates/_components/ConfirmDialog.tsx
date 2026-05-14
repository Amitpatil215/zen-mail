"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    if (props.open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="text-sm font-semibold">{props.title}</div>
        {props.description ? (
          <div className="mt-1 text-sm text-muted-foreground">{props.description}</div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={props.onClose}>
            {props.cancelText ?? "Cancel"}
          </Button>
          <Button
            type="button"
            variant={props.destructive ? "destructive" : "default"}
            onClick={props.onConfirm}
          >
            {props.confirmText ?? "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

