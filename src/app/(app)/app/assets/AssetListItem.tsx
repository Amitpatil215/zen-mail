"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/app/(app)/app/templates/_components/ConfirmDialog";
import { authedTenantFetch } from "./tenantFetch";

export type AssetRow = {
  id: string;
  name: string;
  url: string;
  file_name: string;
  folder: string;
  content_type: string;
  size: number;
  created_at: number;
};

export function AssetListItem(props: {
  asset: AssetRow;
  onDeleted: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [confirm, setConfirm] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function doDelete() {
    const a = confirm;
    setConfirm(null);
    if (!a) return;
    setDeleting(true);
    try {
      const res = await authedTenantFetch(`/api/assets/${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await props.onDeleted();
    } catch (e) {
      props.onError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  const a = props.asset;

  return (
    <>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this asset?"
        description={
          confirm
            ? `This removes “${confirm.name}” (${confirm.file_name}) from your library and storage when possible.`
            : undefined
        }
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onClose={() => setConfirm(null)}
        onConfirm={() => doDelete()}
      />
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{a.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="font-mono">{a.file_name}</span>
            {" • "}
            {a.folder ? `${a.folder} • ` : ""}
            {new Date(a.created_at).toLocaleString()}
          </div>
          {a.content_type?.startsWith("image/") ? (
            <div className="mt-2">
              <img
                src={a.url}
                alt={a.name || a.file_name}
                className="h-16 w-16 rounded-lg border border-border object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(a.url, "_blank", "noopener,noreferrer")}
          >
            Open
          </Button>
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(a.url)}>
            Copy URL
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={deleting}
            aria-label={`Delete ${a.name}`}
            onClick={() => setConfirm(a)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </>
  );
}
