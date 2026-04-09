"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { CreateJobDialog } from "./CreateJobDialog";

type Job = {
  id: string;
  status: string;
  subject: string;
  to: string[];
  retry_count: number;
  last_error?: string | null;
  created_at?: number;
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await authedFetch("/api/email-jobs/list");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { jobs: Job[] };
      setJobs(data.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-6">
      <CreateJobDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          void load();
        }}
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Queue view and send log for all email jobs.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Email jobs</div>
          <Button variant="outline" onClick={() => setCreating(true)} type="button">
            Create job
          </Button>
        </div>
        {error ? <div className="mt-2 text-sm text-destructive">{error}</div> : null}
        <div className="mt-4 grid gap-2">
          {jobs.length ? (
            jobs.map((j) => (
              <div
                key={j.id}
                className="rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{j.subject}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {j.to?.join(", ") || "—"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {j.status} • retries {j.retry_count}
                  </div>
                </div>
                {j.last_error ? (
                  <div className="mt-2 text-xs text-destructive">{j.last_error}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No jobs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

