"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";

type Cred = {
  id: string;
  email_domain: string;
  region: string;
  status: "draft" | "live";
  default_from_email: string;
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

export default function SesSettingsPage() {
  const [creds, setCreds] = useState<Cred[]>([]);
  const [status, setStatus] = useState<"draft" | "live">("draft");
  const [emailDomain, setEmailDomain] = useState("example.com");
  const [region, setRegion] = useState("us-east-1");
  const [fromEmail, setFromEmail] = useState("no-reply@example.com");
  const [fromName, setFromName] = useState("Zen Mail");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await authedFetch("/api/ses-credentials");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { creds: Cred[] };
      setCreds(data.creds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load credentials.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setError(null);
    setMsg(null);
    try {
      const res = await authedFetch("/api/ses-credentials", {
        method: "POST",
        body: JSON.stringify({
          status,
          email_domain: emailDomain,
          region,
          default_from_name: fromName,
          default_from_email: fromEmail,
          ses_access_key: accessKey,
          ses_secret_key: secretKey,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setAccessKey("");
      setSecretKey("");
      setMsg("Saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save credentials.");
    }
  }

  async function testConnection() {
    setError(null);
    setMsg(null);
    try {
      const res = await authedFetch("/api/ses-credentials/test", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { ok: boolean; quota?: unknown };
      setMsg(`Test OK: ${data.ok ? "connected" : "unknown"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection test failed.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SES domains</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add per-tenant SES credentials (encrypted at rest) and test connection.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Add / update credentials</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={emailDomain} onChange={(e)=>setEmailDomain(e.target.value)} placeholder="email domain" />
          <input className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={region} onChange={(e)=>setRegion(e.target.value)} placeholder="region" />
          <input className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={fromName} onChange={(e)=>setFromName(e.target.value)} placeholder="from name" />
          <input className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={fromEmail} onChange={(e)=>setFromEmail(e.target.value)} placeholder="from email" />
          <input className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={accessKey} onChange={(e)=>setAccessKey(e.target.value)} placeholder="SES access key" />
          <input className="h-10 rounded-xl border border-border bg-background px-3 text-sm" value={secretKey} onChange={(e)=>setSecretKey(e.target.value)} placeholder="SES secret key" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!emailDomain.trim() || !region.trim() || !fromEmail.trim()}>
            Save
          </Button>
          <Button variant="outline" onClick={testConnection}>
            Test connection
          </Button>
          <button
            className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
            type="button"
            onClick={() => setStatus((s) => (s === "draft" ? "live" : "draft"))}
          >
            Status: {status}
          </button>
        </div>
        {msg ? <div className="mt-3 text-sm text-emerald-600">{msg}</div> : null}
        {error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Existing</div>
        <div className="mt-3 grid gap-2">
          {creds.length ? (
            creds.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{c.email_domain}</div>
                  <div className="text-xs text-muted-foreground">{c.status}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.region} • {c.default_from_email}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No credentials yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

