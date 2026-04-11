"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { AssetListItem, type AssetRow } from "./AssetListItem";
import { authedTenantFetch } from "./tenantFetch";

export default function AssetsPage() {
  const [folder, setFolder] = useState("email");
  const [name, setName] = useState("");
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setError(null);
    try {
      const res = await authedTenantFetch("/api/assets");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { assets: Asset[] };
      setAssets(data.assets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assets.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const tenantId = getActiveTenantId();
      if (!tenantId) throw new Error("No active tenant selected.");
      const assetName = name.trim() || file.name;
      const { getClientStorage } = await import("@/lib/firebase/client");
      const storage = getClientStorage();
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const objectPath = `tenants/${tenantId}/${folder}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, objectPath);
      await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" });
      const url = await getDownloadURL(storageRef);

      const res = await authedTenantFetch("/api/assets", {
        method: "POST",
        body: JSON.stringify({
          name: assetName,
          url,
          file_name: file.name,
          folder,
          content_type: file.type || "application/octet-stream",
          size: file.size,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload assets to Firebase Storage and store URLs for email templates.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Upload</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:items-end">
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">Name</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Newsletter header image"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">Folder</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="email"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">File</span>
            <input
              ref={fileInputRef}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              type="file"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setSelectedFile(f ?? null);
              }}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {selectedFile ? (
              <>
                Selected: <span className="font-mono text-foreground">{selectedFile.name}</span>
              </>
            ) : (
              "Choose a file, then click Upload."
            )}
          </div>
          <Button
            type="button"
            disabled={busy || !selectedFile}
            onClick={() => {
              if (selectedFile) void upload(selectedFile);
            }}
          >
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
        {error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Recent assets</div>
        <div className="mt-3 grid gap-2">
          {assets.length ? (
            assets.map((a) => (
              <AssetListItem
                key={a.id}
                asset={a}
                onDeleted={load}
                onError={(message) => setError(message)}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No assets yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
