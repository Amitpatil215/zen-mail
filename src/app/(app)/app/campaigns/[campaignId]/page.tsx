"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { authedFetch } from "@/lib/api/authedFetch";
import type { CampaignDoc } from "@/lib/firestore/schema";
import { CampaignRecipientStats } from "./CampaignRecipientStats";
import { CampaignRecipientsTable, type RecipientJobRow } from "./CampaignRecipientsTable";

type CampaignRow = CampaignDoc & { id: string };

export default function CampaignRecipientsPage() {
  const params = useParams();
  const campaignId = typeof params.campaignId === "string" ? params.campaignId : "";

  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [rows, setRows] = useState<RecipientJobRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cRes, jRes] = await Promise.all([
          authedFetch(`/api/campaigns/${encodeURIComponent(campaignId)}`),
          authedFetch(`/api/campaigns/${encodeURIComponent(campaignId)}/jobs`),
        ]);
        if (!cRes.ok) throw new Error(await cRes.text());
        if (!jRes.ok) throw new Error(await jRes.text());
        const cData = (await cRes.json()) as { campaign: CampaignRow };
        const jData = (await jRes.json()) as { jobs: RecipientJobRow[] };
        setCampaign(cData.campaign);
        setRows(jData.jobs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [campaignId]);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/app/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
          ← Campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {loading ? "Campaign" : campaign?.name ?? "Campaign"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recipients and delivery status for this campaign.
          {campaign?.status === "draft" ? " Jobs appear after you schedule send." : null}
        </p>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <CampaignRecipientStats rows={rows} />
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-medium">Recipients</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sent at is set when the job reaches <span className="font-medium">sent</span>. Read tracking applies only
              when open tracking was enabled for this campaign.
            </p>
            <div className="mt-4">
              <CampaignRecipientsTable rows={rows} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
