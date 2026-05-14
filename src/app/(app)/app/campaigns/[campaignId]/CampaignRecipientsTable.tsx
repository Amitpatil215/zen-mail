"use client";

export type RecipientJobRow = {
  job_id: string;
  email: string;
  status: string;
  scheduled_at: number;
  updated_at: number;
  track_email_open: boolean;
  email_opened: boolean;
  email_opened_at: number | null;
};

function fmt(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function readLabel(row: RecipientJobRow) {
  if (!row.track_email_open) return "—";
  return row.email_opened ? "Read" : "Not read";
}

export function CampaignRecipientsTable(props: { rows: RecipientJobRow[] }) {
  if (!props.rows.length) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        No email jobs for this campaign yet. Launch the campaign to create per-recipient jobs.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2.5 font-medium">Recipient</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Sent at</th>
            <th className="px-3 py-2.5 font-medium">Read</th>
            <th className="px-3 py-2.5 font-medium">Opened at</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr key={row.job_id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="px-3 py-2 font-mono text-xs">{row.email || "—"}</td>
              <td className="px-3 py-2 capitalize">{row.status}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {row.status === "sent" ? fmt(row.updated_at) : "—"}
              </td>
              <td className="px-3 py-2">{readLabel(row)}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmt(row.email_opened_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
