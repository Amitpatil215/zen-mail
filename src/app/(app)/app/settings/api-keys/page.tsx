"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";

type ApiKeyRow = {
  id: string;
  name: string;
  created_at: number | null;
  last_used_at: number | null;
  revoked_at: number | null;
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

export default function ApiKeysPage() {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("Server key");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(
    () => rows.filter((r) => !r.revoked_at).length,
    [rows]
  );

  async function load() {
    setError(null);
    try {
      const res = await authedFetch("/api/api-keys");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { keys: ApiKeyRow[] };
      setRows(data.keys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load API keys.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createKey() {
    setError(null);
    setNewKey(null);
    try {
      const res = await authedFetch("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { api_key: { raw: string } };
      setNewKey(data.api_key.raw);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create API key.");
    }
  }

  async function revoke(keyId: string) {
    setError(null);
    try {
      const res = await authedFetch(`/api/api-keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke API key.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keys are used for server-to-server URL-based sending.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Create key</div>
          <div className="text-xs text-muted-foreground">
            Active: {activeCount}
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">Name</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <Button onClick={createKey} disabled={!name.trim()}>
            Create
          </Button>
        </div>
        {newKey ? (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="text-xs font-medium text-muted-foreground">
              Copy this key now (shown once)
            </div>
            <div className="mt-2 break-all font-mono text-sm">{newKey}</div>
          </div>
        ) : null}
        {error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Existing keys</div>
        <div className="mt-3 grid gap-2">
          {rows.length ? (
            rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {r.revoked_at ? "Revoked" : "Active"}
                    {r.last_used_at ? ` • used ${new Date(r.last_used_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <Button
                  variant="outline"
                  disabled={!!r.revoked_at}
                  onClick={() => revoke(r.id)}
                >
                  Revoke
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No keys yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

