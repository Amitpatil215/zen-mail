"use client";

import { Button } from "@/components/ui/button";
import type { TemplateRow } from "@/lib/templates/firestore";

export type SesCred = {
  id: string;
  email_domain: string;
  region: string;
  status: string;
  default_from_name: string;
  default_from_email: string;
};

export function CreateJobDialogView(props: {
  open: boolean;
  loading: boolean;
  error: string | null;
  variablesError: string | null;
  sesCreds: SesCred[];
  templates: TemplateRow[];
  sesCredentialId: string;
  fromEmail: string;
  toEmail: string;
  ccEmail: string;
  bccEmail: string;
  templateId: string;
  subject: string;
  variablesText: string;
  onClose: () => void;
  onCreateJob: () => void;
  onChangeSesCredentialId: (next: string) => void;
  onChangeFromEmail: (next: string) => void;
  onChangeToEmail: (next: string) => void;
  onChangeCcEmail: (next: string) => void;
  onChangeBccEmail: (next: string) => void;
  onChangeTemplateId: (next: string) => void;
  onResetVariablesToTemplateSample: () => void;
  onChangeSubject: (next: string) => void;
  onChangeVariablesText: (next: string) => void;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={props.onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Create job</div>
            <div className="mt-1 text-sm text-muted-foreground">Send one templated email to one recipient.</div>
          </div>
          <Button type="button" variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <div className="text-xs font-medium text-muted-foreground">SES credentials</div>
            <select
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.sesCredentialId}
              onChange={(e) => props.onChangeSesCredentialId(e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {props.sesCreds.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.email_domain} ({c.region}) {c.status === "live" ? "• live" : "• draft"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <div className="text-xs font-medium text-muted-foreground">From email</div>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.fromEmail}
              onChange={(e) => props.onChangeFromEmail(e.target.value)}
              placeholder="no-reply@example.com"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="text-xs font-medium text-muted-foreground">To</div>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.toEmail}
              onChange={(e) => props.onChangeToEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="text-xs font-medium text-muted-foreground">CC (optional)</div>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.ccEmail}
              onChange={(e) => props.onChangeCcEmail(e.target.value)}
              placeholder="cc@example.com"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="text-xs font-medium text-muted-foreground">BCC (optional)</div>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.bccEmail}
              onChange={(e) => props.onChangeBccEmail(e.target.value)}
              placeholder="bcc@example.com"
            />
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">Template</div>
            <select
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.templateId}
              onChange={(e) => props.onChangeTemplateId(e.target.value)}
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

          <div className="grid gap-1.5 md:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">Subject (Liquid allowed)</div>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={props.subject}
              onChange={(e) => props.onChangeSubject(e.target.value)}
              placeholder="Hello {{ person.first_name }}"
            />
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-muted-foreground">Variables (JSON)</div>
              <Button type="button" variant="outline" onClick={props.onResetVariablesToTemplateSample}>
                Reset to template sample
              </Button>
            </div>
            <textarea
              className="min-h-[140px] rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs"
              value={props.variablesText}
              onChange={(e) => props.onChangeVariablesText(e.target.value)}
              spellCheck={false}
            />
            {props.variablesError ? <div className="text-sm text-destructive">{props.variablesError}</div> : null}
          </div>
        </div>

        {props.error ? <div className="mt-3 text-sm text-destructive">{props.error}</div> : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={props.onClose} disabled={props.loading}>
            Cancel
          </Button>
          <Button type="button" onClick={props.onCreateJob} disabled={props.loading}>
            {props.loading ? "Creating…" : "Create job"}
          </Button>
        </div>
      </div>
    </div>
  );
}

