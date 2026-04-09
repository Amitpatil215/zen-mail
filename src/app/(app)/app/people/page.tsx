"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";

type Person = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  tags?: string[];
  unsubscribed_at?: number | null;
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

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await authedFetch("/api/people");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { people: Person[] };
      setPeople(data.people);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load people.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    setError(null);
    try {
      const res = await authedFetch("/api/people", {
        method: "POST",
        body: JSON.stringify({
          email,
          first_name: first || undefined,
          last_name: last || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEmail("");
      setFirst("");
      setLast("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add person.");
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage contacts, tags, and custom fields for your tenant.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Coming soon</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Segments, bulk import/export, advanced tagging, and custom fields are
          coming soon.
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Add contact</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:col-span-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.com"
          />
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="First name"
          />
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Last name"
          />
        </div>
        <div className="mt-3">
          <Button onClick={add} disabled={!email.trim()}>
            Add
          </Button>
        </div>
        {error ? <div className="mt-3 text-sm text-destructive">{error}</div> : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Contacts</div>
        <div className="mt-3 grid gap-2">
          {people.length ? (
            people.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.email}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {(p.first_name || p.last_name
                      ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                      : "—") + (p.unsubscribed_at ? " • unsubscribed" : "")}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No contacts yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

