"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setActiveTenantId } from "@/lib/tenants/activeTenant";

type Tenant = { id: string; name: string };

type State =
  | { kind: "loading" }
  | { kind: "ready"; tenants: Tenant[] }
  | { kind: "error"; message: string };

async function authedFetch(path: string, init?: RequestInit) {
  const { getClientAuth } = await import("@/lib/firebase/client");
  const auth = getClientAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in.");
  const { getActiveTenantId } = await import("@/lib/tenants/activeTenant");
  const activeTenantId = getActiveTenantId();
  return fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(activeTenantId ? { "x-tenant-id": activeTenantId } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export default function TenantSettingsPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [newTenantName, setNewTenantName] = useState("My Org");

  const tenants = useMemo(
    () => (state.kind === "ready" ? state.tenants : []),
    [state]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch("/api/tenants");
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { tenants: Tenant[] };
        setState({ kind: "ready", tenants: data.tenants });
      } catch (e) {
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Failed to load tenants.",
        });
      }
    })();
  }, []);

  async function createTenant() {
    try {
      const res = await authedFetch("/api/tenants", {
        method: "POST",
        body: JSON.stringify({ name: newTenantName }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { tenant: Tenant };
      setActiveTenantId(data.tenant.id);
      router.replace("/app");
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to create tenant.",
      });
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create/select a tenant. This is required before using the dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Select tenant</div>
        {state.kind === "loading" ? (
          <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
        ) : null}
        {state.kind === "error" ? (
          <div className="mt-2 text-sm text-destructive">{state.message}</div>
        ) : null}
        {state.kind === "ready" ? (
          <div className="mt-3 grid gap-2">
            {tenants.length ? (
              tenants.map((t) => (
                <button
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left hover:bg-muted"
                  onClick={() => {
                    setActiveTenantId(t.id);
                    router.replace("/app");
                  }}
                  type="button"
                >
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">Use</div>
                </button>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                No tenants yet. Create one below.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Create tenant</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">Tenant name</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              placeholder="My Org"
            />
          </label>
          <Button onClick={createTenant} disabled={!newTenantName.trim()}>
            Create
          </Button>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Roles and member management will be added next.
        </div>
      </div>
    </div>
  );
}
