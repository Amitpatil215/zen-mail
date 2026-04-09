"use client";

import { useEffect, useMemo, useState } from "react";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { listTemplatesPage, type TemplateRow } from "@/lib/templates/firestore";
import { authedFetch } from "@/lib/api/authedFetch";
import { CreateJobDialogView, type SesCred } from "./CreateJobDialogView";
import { parseJsonObject } from "./createJobDialogUtils";

export function CreateJobDialog(props: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { open, onClose, onCreated } = props;
  const tenantId = useMemo(() => getActiveTenantId(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sesCreds, setSesCreds] = useState<SesCred[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);

  const [sesCredentialId, setSesCredentialId] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [bccEmail, setBccEmail] = useState("");

  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [variablesText, setVariablesText] = useState("{}");
  const [variablesError, setVariablesError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVariablesError(null);

    async function load() {
      setLoading(true);
      try {
        if (!tenantId) throw new Error("No active tenant selected.");

        const [credsRes, tplRes] = await Promise.all([
          authedFetch("/api/ses-credentials"),
          listTemplatesPage({ tenantId, pageSize: 50, after: null }),
        ]);
        if (!credsRes.ok) throw new Error(await credsRes.text());
        const credsData = (await credsRes.json()) as { creds: SesCred[] };

        setSesCreds(credsData.creds);
        setTemplates(tplRes.items);

        const firstLive = credsData.creds.find((c) => c.status === "live") ?? credsData.creds[0];
        if (firstLive) {
          setSesCredentialId(firstLive.id);
          setFromEmail(firstLive.default_from_email ?? "");
        } else {
          setSesCredentialId("");
          setFromEmail("");
        }

        const firstTpl = tplRes.items[0];
        if (firstTpl) {
          setTemplateId(firstTpl.id);
          setSubject(firstTpl.subject ?? "");
          setVariablesText(JSON.stringify(firstTpl.sample_data ?? {}, null, 2));
        } else {
          setTemplateId("");
          setSubject("");
          setVariablesText("{}");
        }

        setToEmail("");
        setCcEmail("");
        setBccEmail("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load form data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const selectedCred = sesCreds.find((c) => c.id === sesCredentialId) ?? null;

  async function createJob() {
    setError(null);
    setVariablesError(null);
    const parsed = parseJsonObject(variablesText);
    if (!parsed.ok) {
      setVariablesError(parsed.error);
      return;
    }
    if (!templateId) {
      setError("Pick a template.");
      return;
    }
    if (!sesCredentialId) {
      setError("Pick SES credentials.");
      return;
    }
    if (!toEmail.trim()) {
      setError("Enter one recipient email.");
      return;
    }

    setLoading(true);
    try {
      const idempotency_key =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? `ui_${crypto.randomUUID()}` : `ui_${Date.now()}`;
      const res = await authedFetch("/api/email-jobs", {
        method: "POST",
        body: JSON.stringify({
          type: "template",
          template_id: templateId,
          ses_credential_id: sesCredentialId,
          from_email: fromEmail || selectedCred?.default_from_email || undefined,
          to: [toEmail.trim()],
          cc: ccEmail.trim() ? [ccEmail.trim()] : [],
          bcc: bccEmail.trim() ? [bccEmail.trim()] : [],
          subject: subject.trim() || selectedTemplate?.subject || "Template email",
          variables: parsed.value,
          idempotency_key,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onClose();
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CreateJobDialogView
      open={open}
      loading={loading}
      error={error}
      variablesError={variablesError}
      sesCreds={sesCreds}
      templates={templates}
      sesCredentialId={sesCredentialId}
      fromEmail={fromEmail}
      toEmail={toEmail}
      ccEmail={ccEmail}
      bccEmail={bccEmail}
      templateId={templateId}
      subject={subject}
      variablesText={variablesText}
      onClose={onClose}
      onCreateJob={createJob}
      onChangeSesCredentialId={(next) => {
        setSesCredentialId(next);
        const c = sesCreds.find((x) => x.id === next);
        if (c?.default_from_email) setFromEmail(c.default_from_email);
      }}
      onChangeFromEmail={setFromEmail}
      onChangeToEmail={setToEmail}
      onChangeCcEmail={setCcEmail}
      onChangeBccEmail={setBccEmail}
      onChangeTemplateId={(next) => {
        setTemplateId(next);
        const t = templates.find((x) => x.id === next);
        if (t) {
          setSubject(t.subject ?? "");
          setVariablesText(JSON.stringify(t.sample_data ?? {}, null, 2));
        }
      }}
      onResetVariablesToTemplateSample={() => setVariablesText(JSON.stringify(selectedTemplate?.sample_data ?? {}, null, 2))}
      onChangeSubject={setSubject}
      onChangeVariablesText={setVariablesText}
    />
  );
}

