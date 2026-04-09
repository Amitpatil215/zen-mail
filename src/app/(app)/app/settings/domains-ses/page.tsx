"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { ExistingSesCreds } from "./ExistingSesCreds";

type Cred = {
  id: string;
  email_domain: string;
  region: string;
  status: string;
  default_from_name: string;
  default_from_email: string;
  ses_access_key: string;
  ses_secret_key: string;
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

  function editRow(c: Cred) {
    setEmailDomain(c.email_domain);
    setRegion(c.region);
    setFromName(c.default_from_name);
    setFromEmail(c.default_from_email);
    setStatus(c.status === "live" ? "live" : "draft");
    setAccessKey(c.ses_access_key ?? "");
    setSecretKey(c.ses_secret_key ?? "");
    setMsg(null);
  }

  async function deleteRow(c: Cred) {
    setError(null);
    setMsg(null);
    const ok = window.confirm(`Delete SES credentials for ${c.email_domain}?`);
    if (!ok) return;
    try {
      const res = await authedFetch(
        `/api/ses-credentials?email_domain=${encodeURIComponent(c.email_domain)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await res.text());
      setMsg("Deleted.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete credentials.");
    }
  }

  async function testConnection() {
    setError(null);
    setMsg(null);
    try {
      const res = await authedFetch("/api/ses-credentials/test", {
        method: "POST",
        body: JSON.stringify({
          region,
          ses_access_key: accessKey,
          ses_secret_key: secretKey,
        }),
      });
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
        <h1 className="text-2xl font-semibold tracking-tight">SES Credentials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add per-tenant SES credentials and test connection.
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
          <select
            className="h-10 w-40 rounded-xl border border-border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value === "live" ? "live" : "draft")}
          >
            <option value="draft">draft</option>
            <option value="live">live</option>
          </select>
        </div>
        {msg ? <div className="mt-3 text-sm text-emerald-600">{msg}</div> : null}
        {error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
      </div>

      <ExistingSesCreds creds={creds} onEdit={editRow} onDelete={deleteRow} />
    </div>
  );
}

