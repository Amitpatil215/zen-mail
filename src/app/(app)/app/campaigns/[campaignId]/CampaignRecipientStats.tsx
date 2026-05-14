"use client";

import { useMemo } from "react";
import type { RecipientJobRow } from "./CampaignRecipientsTable";

export type RecipientStats = {
  yetToSend: number;
  failed: number;
  sent: number;
  seen: number;
  yetToSee: number;
  trackedSent: number;
  /** Opens ÷ sent jobs with open tracking; null if none tracked. */
  openRatePct: number | null;
};

export function computeRecipientStats(rows: RecipientJobRow[]): RecipientStats {
  let yetToSend = 0;
  let failed = 0;
  let sent = 0;
  let seen = 0;
  let yetToSee = 0;
  let trackedSent = 0;

  for (const r of rows) {
    if (r.status === "queued" || r.status === "processing") yetToSend++;
    else if (r.status === "failed") failed++;
    else if (r.status === "sent") {
      sent++;
      if (r.track_email_open) {
        trackedSent++;
        if (r.email_opened) seen++;
        else yetToSee++;
      }
    }
  }

  const openRatePct =
    trackedSent > 0 ? Math.round((seen / trackedSent) * 1000) / 10 : null;

  return { yetToSend, failed, sent, seen, yetToSee, trackedSent, openRatePct };
}

function StatCard(props: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs leading-snug text-muted-foreground">{props.hint}</div> : null}
    </div>
  );
}

export function CampaignRecipientStats(props: { rows: RecipientJobRow[] }) {
  const s = useMemo(() => computeRecipientStats(props.rows), [props.rows]);

  const ctorDisplay =
    s.openRatePct == null
      ? "—"
      : `${s.openRatePct}%`;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Yet to send"
        value={s.yetToSend}
        hint="Queued or still processing."
      />
      <StatCard label="Failed" value={s.failed} hint="Stopped after max retries." />
      <StatCard label="Sent" value={s.sent} hint="Successfully handed off to SES." />
      <StatCard
        label="Seen (opened)"
        value={s.seen}
        hint="Pixel fired at least once (tracking on)."
      />
      <StatCard
        label="Yet to see"
        value={s.yetToSee}
        hint="Sent with tracking, no open yet."
      />
      <StatCard
        label="CTOR"
        value={ctorDisplay}
        hint="Here: opens ÷ sent with tracking. Classic CTOR uses link clicks ÷ opens — clicks are not tracked yet."
      />
    </div>
  );
}
