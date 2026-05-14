"use client";

import { useMemo, useState } from "react";

type EmailJob = {
  id: string;
  status?: string | null;
  type?: string | null;
  campaign_id?: string | null;
  subject?: string | null;
  from_email?: string | null;
  from_name?: string | null;
  to?: string[] | null;
  cc?: string[] | null;
  bcc?: string[] | null;
  template_id?: string | null;
  ses_credential_id?: string | null;
  track_email_open?: boolean | null;
  email_opened?: boolean | null;
  email_opened_at?: number | null;
  ses_message_id?: string | null;
  retry_count?: number | null;
  max_retries?: number | null;
  last_error?: string | null;
  scheduled_at?: number | null;
  next_attempt_at?: number | null;
  locked_at?: number | null;
  locked_by?: string | null;
  created_at?: number | null;
  updated_at?: number | null;
};

function fmtMs(ms?: number | null) {
  if (!ms || !Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

function statusTone(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "sent":
      return { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-500/10" };
    case "queued":
      return { dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-300", bg: "bg-sky-500/10" };
    case "sending":
    case "processing":
      return { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-500/10" };
    case "failed":
    case "error":
      return { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", bg: "bg-rose-500/10" };
    default:
      return { dot: "bg-muted-foreground/50", text: "text-muted-foreground", bg: "bg-muted" };
  }
}

function Field(props: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-[11px] font-medium text-muted-foreground">{props.label}</div>
      <div className="min-w-0 truncate text-xs">{props.value || "—"}</div>
    </div>
  );
}

export function JobRow(props: { job: EmailJob }) {
  const { job } = props;
  const [open, setOpen] = useState(false);

  const recipients = useMemo(() => {
    const to = (job.to ?? []).filter(Boolean);
    const cc = (job.cc ?? []).filter(Boolean);
    const bcc = (job.bcc ?? []).filter(Boolean);
    return { to, cc, bcc, all: [...to, ...cc, ...bcc] };
  }, [job.to, job.cc, job.bcc]);

  const tone = statusTone(job.status);
  const subject = (job.subject ?? "").trim() || "—";
  const status = (job.status ?? "").trim() || "unknown";
  const retryText = `${job.retry_count ?? 0}/${job.max_retries ?? 0}`;
  const fromText = job.from_email ? `${job.from_name ? `${job.from_name} ` : ""}<${job.from_email}>` : "—";

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{subject}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {recipients.to.length ? recipients.to.join(", ") : "—"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] ${tone.bg} ${tone.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            <span className="whitespace-nowrap">{status}</span>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {job.last_error ? <div className="mt-2 text-xs text-destructive">{job.last_error}</div> : null}

      {open ? (
        <div className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-3">
          <Field label="Job id" value={job.id} />
          <Field label="Campaign id" value={job.campaign_id ?? "—"} />
          <Field label="Type" value={(job.type ?? "").toString() || "—"} />
          <Field label="Retries" value={retryText} />

          <Field label="From" value={fromText} />
          <Field label="To / CC / BCC" value={`${recipients.to.length}/${recipients.cc.length}/${recipients.bcc.length}`} />
          <Field label="SES message id" value={job.ses_message_id ?? "—"} />

          <Field label="Scheduled at" value={fmtMs(job.scheduled_at)} />
          <Field label="Next attempt at" value={fmtMs(job.next_attempt_at)} />
          <Field label="Updated at" value={fmtMs(job.updated_at)} />

          <Field label="Created at" value={fmtMs(job.created_at)} />
          <Field label="Locked at" value={fmtMs(job.locked_at)} />
          <Field label="Locked by" value={job.locked_by ?? "—"} />

          <Field label="Template id" value={job.template_id ?? "—"} />
          <Field label="SES credential id" value={job.ses_credential_id ?? "—"} />
          <Field
            label="Open tracking"
            value={
              job.track_email_open === true
                ? job.email_opened === true
                  ? `Opened${job.email_opened_at ? ` (${fmtMs(job.email_opened_at)})` : ""}`
                  : "Enabled (not opened yet)"
                : "Off"
            }
          />
          <Field label="Recipients (all)" value={recipients.all.length ? recipients.all.join(", ") : "—"} />
        </div>
      ) : null}
    </div>
  );
}

