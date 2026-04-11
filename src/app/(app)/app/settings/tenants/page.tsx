"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getActiveTenantId, setActiveTenantId } from "@/lib/tenants/activeTenant";

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

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for older browsers / stricter permissions.
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.top = "-1000px";
  el.style.left = "-1000px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export default function TenantSettingsPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [authUserReady, setAuthUserReady] = useState(false);

  const tenants = useMemo(
    () => (state.kind === "ready" ? state.tenants : []),
    [state]
  );

  useEffect(() => {
    let unsubAuth: undefined | (() => void);
    (async () => {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { onAuthStateChanged } = await import("firebase/auth");
      unsubAuth = onAuthStateChanged(auth, (user) => {
        setAccountEmail(user?.email ?? null);
        setAuthUserReady(true);
      });
    })().catch(() => setAuthUserReady(true));
    return () => unsubAuth?.();
  }, []);

  useEffect(() => {
    setActiveTenantIdState(getActiveTenantId());

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

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-lg font-medium tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Pick a workspace.
        </p>
      </div>

      <section className="space-y-1.5">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Signed in
        </h2>
        <p className="text-sm break-all">
          {!authUserReady ? (
            <span className="text-muted-foreground">Loading…</span>
          ) : accountEmail ? (
            accountEmail
          ) : (
            <span className="text-muted-foreground">No email</span>
          )}
        </p>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Tenant ID
        </h2>
        <div className="flex min-w-0 items-start gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md bg-muted/50 px-2 py-1 font-mono text-xs">
            {activeTenantId ?? "—"}
          </code>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!activeTenantId}
              onClick={async () => {
                if (!activeTenantId) return;
                setCopyState("idle");
                try {
                  await copyToClipboard(activeTenantId);
                  setCopyState("copied");
                  window.setTimeout(() => setCopyState("idle"), 1200);
                } catch {
                  setCopyState("error");
                }
              }}
            >
              Copy
            </Button>
            {copyState === "copied" ? (
              <span className="text-[10px] text-muted-foreground">Copied</span>
            ) : null}
            {copyState === "error" ? (
              <span className="text-[10px] text-destructive">Failed</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspaces
        </h2>
        {state.kind === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {state.kind === "error" ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}
        {state.kind === "ready" ? (
          tenants.length ? (
            <ul className="divide-y divide-border rounded-md border border-border">
              {tenants.map((t) => (
                <li key={t.id}>
                  <button
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/60"
                    onClick={() => {
                      setActiveTenantId(t.id);
                      setActiveTenantIdState(t.id);
                      router.replace("/app");
                    }}
                    type="button"
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None yet.</p>
          )
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          New workspace
        </h2>
        <div className="flex gap-2">
          <input
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
            disabled
            placeholder="Name"
            aria-label="Workspace name"
          />
          <Button size="sm" className="shrink-0" disabled type="button">
            Create
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Creating workspaces isn&apos;t available yet.
        </p>
      </section>
    </div>
  );
}
