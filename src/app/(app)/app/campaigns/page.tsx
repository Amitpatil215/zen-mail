"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authedFetch } from "@/lib/api/authedFetch";
import type { CampaignDoc } from "@/lib/firestore/schema";

type Row = CampaignDoc & { id: string };

export default function CampaignsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await authedFetch("/api/campaigns");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { campaigns: Row[] };
      setRows(data.campaigns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drafts, scheduled launches, and one email job per recipient in your groups.
          </p>
        </div>
        <Button asChild type="button">
          <Link href="/app/campaigns/new">New campaign</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Recent campaigns</div>
        {error ? <div className="mt-2 text-sm text-destructive">{error}</div> : null}
        <div className="mt-4 grid gap-2">
          {rows.length ? (
            rows.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.status === "draft" ? "Draft" : "Launched"}
                    {typeof c.recipient_count === "number" ? ` · ${c.recipient_count} jobs` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {c.status === "draft" ? (
                    <Button asChild variant="outline" size="sm" type="button">
                      <Link href={`/app/campaigns/new?draft=${encodeURIComponent(c.id)}`}>Continue</Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm" type="button">
                    <Link href={`/app/campaigns/${encodeURIComponent(c.id)}`}>Recipients</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No campaigns yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
