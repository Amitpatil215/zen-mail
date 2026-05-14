"use client";

import type { TemplateRow } from "@/lib/templates/firestore";

export type SesCredLite = {
  id: string;
  email_domain: string;
  region: string;
  status: string;
  default_from_email: string;
};

export type GroupRow = { id: string; name: string; is_default: boolean };

export type PreviewResponse = {
  recipient_count: number;
  recipients_sample: Array<{ email: string; first_name: string; last_name: string }>;
  groups: Array<{ id: string; name: string }>;
  template: { id: string; name: string; subject: string };
  scheduled_at: number;
  rendered_html: string | null;
  track_email_open: boolean;
};

type Props = {
  step: number;
  name: string;
  onName: (v: string) => void;
  templates: TemplateRow[];
  templateId: string;
  onTemplateId: (v: string) => void;
  sesCreds: SesCredLite[];
  sesCredentialId: string;
  onSesCredentialId: (v: string) => void;
  fromEmail: string;
  onFromEmail: (v: string) => void;
  fromName: string;
  onFromName: (v: string) => void;
  subject: string;
  onSubject: (v: string) => void;
  variablesText: string;
  onVariablesText: (v: string) => void;
  ccText: string;
  onCcText: (v: string) => void;
  bccText: string;
  onBccText: (v: string) => void;
  trackEmailOpen: boolean;
  onTrackEmailOpen: (v: boolean) => void;
  groups: GroupRow[];
  groupIds: string[];
  onToggleGroup: (id: string) => void;
  scheduledLocal: string;
  onScheduledLocal: (v: string) => void;
  preview: PreviewResponse | null;
  previewLoading: boolean;
  previewError: string | null;
};

export function splitEmails(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CampaignFormSteps(props: Props) {
  const selTpl = props.templates.find((t) => t.id === props.templateId);

  if (props.step === 0) {
    return (
      <div className="grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Target groups (union of members)</div>
        <div className="grid gap-2 rounded-xl border border-border p-3">
          {props.groups.length ? (
            props.groups.map((g) => (
              <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={props.groupIds.includes(g.id)}
                  onChange={() => props.onToggleGroup(g.id)}
                  className="size-4 rounded border-border"
                />
                <span>
                  {g.name}
                  {g.is_default ? (
                    <span className="ml-2 text-xs text-muted-foreground">(default)</span>
                  ) : null}
                </span>
              </label>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No groups yet. Add people with groups first.</div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          People in any selected group receive one email. You can pick up to 10 groups (Firestore limit).
        </p>
      </div>
    );
  }

  if (props.step === 1) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">Campaign name</div>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.name}
            onChange={(e) => props.onName(e.target.value)}
            placeholder="Spring promo"
          />
        </div>
        <div className="grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">Template</div>
          <select
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.templateId}
            onChange={(e) => props.onTemplateId(e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {props.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">SES credentials</div>
          <select
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.sesCredentialId}
            onChange={(e) => props.onSesCredentialId(e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {props.sesCreds.map((c) => (
              <option key={c.id} value={c.id}>
                {c.email_domain} ({c.region})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">From email</div>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.fromEmail}
            onChange={(e) => props.onFromEmail(e.target.value)}
            placeholder={props.sesCreds.find((c) => c.id === props.sesCredentialId)?.default_from_email ?? ""}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">From name (optional)</div>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.fromName}
            onChange={(e) => props.onFromName(e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
        <div className="md:col-span-2 grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">Subject (Liquid supported)</div>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.subject}
            onChange={(e) => props.onSubject(e.target.value)}
            placeholder={selTpl?.subject ?? "Subject"}
          />
        </div>
        <div className="md:col-span-2 grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">Template variables (JSON object)</div>
          <textarea
            className="min-h-32 rounded-xl border border-border bg-background p-3 font-mono text-xs"
            value={props.variablesText}
            onChange={(e) => props.onVariablesText(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">CC (optional, comma-separated)</div>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.ccText}
            onChange={(e) => props.onCcText(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="text-xs font-medium text-muted-foreground">BCC (optional, comma-separated)</div>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            value={props.bccText}
            onChange={(e) => props.onBccText(e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-start gap-2 md:col-span-2">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-border"
            checked={props.trackEmailOpen}
            onChange={(e) => props.onTrackEmailOpen(e.target.checked)}
          />
          <span className="text-sm leading-snug">
            <span className="font-medium">Track email opens</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Adds a hidden image to HTML on each job so the first open is recorded. Requires PUBLIC_BASE_URL.
            </span>
          </span>
        </label>
      </div>
    );
  }

  if (props.step === 2) {
    return (
      <div className="grid max-w-md gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">Send date & time (your local timezone)</div>
        <input
          type="datetime-local"
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
          value={props.scheduledLocal}
          onChange={(e) => props.onScheduledLocal(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Jobs are queued for this time. If the time is in the past when you launch, sends start immediately.
        </p>
      </div>
    );
  }

  const p = props.preview;
  return (
    <div className="grid gap-4">
      {props.previewLoading ? (
        <div className="text-sm text-muted-foreground">Building preview…</div>
      ) : null}
      {props.previewError ? (
        <div className="text-sm text-destructive">{props.previewError}</div>
      ) : null}
      {p ? (
        <>
          <div className="grid gap-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div>
              <span className="text-muted-foreground">Recipients (unique, subscribed): </span>
              <span className="font-medium">{p.recipient_count}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Groups: </span>
              {p.groups.map((g) => g.name).join(", ") || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Template: </span>
              {p.template.name}
            </div>
            <div>
              <span className="text-muted-foreground">Template subject line: </span>
              {p.template.subject}
            </div>
            <div>
              <span className="text-muted-foreground">Track opens: </span>
              {p.track_email_open ? "On" : "Off"}
            </div>
          </div>
          {p.recipients_sample.length ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Sample recipients</div>
              <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-border p-2 text-xs">
                {p.recipients_sample.map((r) => (
                  <li key={r.email}>
                    {r.email}
                    {(r.first_name || r.last_name) && ` — ${r.first_name} ${r.last_name}`.trim()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {p.rendered_html ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">HTML preview (first recipient)</div>
              <iframe
                title="Preview"
                className="mt-2 h-80 w-full rounded-xl border border-border bg-white"
                sandbox="allow-same-origin"
                srcDoc={p.rendered_html}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No recipients to preview rendering.</div>
          )}
        </>
      ) : null}
    </div>
  );
}
