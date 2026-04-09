"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";

type Asset = {
  id: string;
  name: string;
  url: string;
  file_name: string;
  folder: string;
  content_type: string;
  size: number;
  created_at: number;
};

async function authedFetch(path: string, init?: RequestInit) {
  const tenantId = getActiveTenantId();
  if (!tenantId) throw new Error("No active tenant selected.");
  const { getClientAuth } = await import("@/lib/firebase/client");
  const token = await getClientAuth().currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in.");

  return fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-tenant-id": tenantId,
      ...(init?.headers ?? {}),
    },
  });
}

export default function AssetsPage() {
  const [folder, setFolder] = useState("email");
  const [name, setName] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await authedFetch("/api/assets");
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

      const res = await authedFetch("/api/assets", {
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
              className="h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              type="file"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </label>
        </div>
        {error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Recent assets</div>
        <div className="mt-3 grid gap-2">
          {assets.length ? (
            assets.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3"
              >
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
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(a.url)}
                  >
                    Copy URL
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No assets yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
