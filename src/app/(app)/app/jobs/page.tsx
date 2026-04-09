"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { CreateJobDialog } from "./CreateJobDialog";
import { JobRow } from "./JobRow";

type Job = {
  id: string;
  status: string;
  subject: string;
  to: string[];
  retry_count: number;
  last_error?: string | null;
  created_at?: number;
  type?: string | null;
  from_email?: string | null;
  from_name?: string | null;
  cc?: string[] | null;
  bcc?: string[] | null;
  template_id?: string | null;
  ses_credential_id?: string | null;
  ses_message_id?: string | null;
  max_retries?: number | null;
  scheduled_at?: number | null;
  next_attempt_at?: number | null;
  locked_at?: number | null;
  locked_by?: string | null;
  updated_at?: number | null;
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
              <JobRow key={j.id} job={j} />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No jobs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

