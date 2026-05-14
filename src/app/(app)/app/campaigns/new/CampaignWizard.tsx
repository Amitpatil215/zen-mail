"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authedFetch } from "@/lib/api/authedFetch";
import type { CampaignPayloadIn } from "@/lib/campaigns/campaignPayload";
import { MAX_CAMPAIGN_GROUPS } from "@/lib/campaigns/campaignPayload";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { listTemplatesPage, type TemplateRow } from "@/lib/templates/firestore";
import { parseJsonObject } from "../../jobs/createJobDialogUtils";
import {
  CampaignFormSteps,
  type GroupRow,
  type PreviewResponse,
  type SesCredLite,
  splitEmails,
} from "./CampaignFormSteps";

function formatDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function parseDatetimeLocalValue(s: string): number {
  return new Date(s).getTime();
}

export function CampaignWizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const draftId = sp.get("draft");
  const tenantId = useMemo(() => getActiveTenantId(), []);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campaignId, setCampaignId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [sesCreds, setSesCreds] = useState<SesCredLite[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [sesCredentialId, setSesCredentialId] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [subject, setSubject] = useState("");
  const [variablesText, setVariablesText] = useState("{}");
  const [ccText, setCcText] = useState("");
  const [bccText, setBccText] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [scheduledLocal, setScheduledLocal] = useState(() =>
    formatDatetimeLocalValue(Date.now() + 60 * 60 * 1000)
  );

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        if (!tenantId) throw new Error("No active tenant.");

        if (draftId) {
          const res = await authedFetch(`/api/campaigns/${draftId}`);
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as {
            campaign: Record<string, unknown> & { id: string; status: string };
          };
          const c = data.campaign;
          if (c.status !== "draft") setError("This campaign is already launched.");
          setCampaignId(c.id);
          setName(String(c.name ?? ""));
          setTemplateId(String(c.template_id ?? ""));
          setGroupIds(Array.isArray(c.group_ids) ? (c.group_ids as string[]) : []);
          setScheduledLocal(formatDatetimeLocalValue(Number(c.scheduled_at ?? Date.now())));
          setSesCredentialId(String(c.ses_credential_id ?? ""));
          setFromEmail(String(c.from_email ?? ""));
          setFromName(String(c.from_name ?? ""));
          setSubject(String(c.subject ?? ""));
          setVariablesText(JSON.stringify(c.variables ?? {}, null, 2));
          setCcText(Array.isArray(c.cc) ? (c.cc as string[]).join(", ") : "");
          setBccText(Array.isArray(c.bcc) ? (c.bcc as string[]).join(", ") : "");
        }

        const [credsRes, tplRes, groupsRes] = await Promise.all([
          authedFetch("/api/ses-credentials"),
          listTemplatesPage({ tenantId, pageSize: 50, after: null }),
          authedFetch("/api/groups"),
        ]);
        if (!credsRes.ok) throw new Error(await credsRes.text());
        if (!groupsRes.ok) throw new Error(await groupsRes.text());
        const credsData = (await credsRes.json()) as { creds: SesCredLite[] };
        const groupsData = (await groupsRes.json()) as { groups: GroupRow[] };

        setSesCreds(credsData.creds);
        setTemplates(tplRes.items);
        setGroups(groupsData.groups);

        if (!draftId) {
          const firstLive = credsData.creds.find((c) => c.status === "live") ?? credsData.creds[0];
          if (firstLive) {
            setSesCredentialId(firstLive.id);
            setFromEmail(firstLive.default_from_email ?? "");
          }
          const t0 = tplRes.items[0];
          if (t0) {
            setTemplateId(t0.id);
            setSubject(t0.subject ?? "");
            setVariablesText(JSON.stringify(t0.sample_data ?? {}, null, 2));
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    void boot();
  }, [tenantId, draftId]);

  const buildPayload = useCallback(():
    | { ok: true; value: CampaignPayloadIn }
    | { ok: false; error: string } => {
    const parsed = parseJsonObject(variablesText);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    if (!name.trim()) return { ok: false, error: "Enter a campaign name." };
    if (!templateId) return { ok: false, error: "Pick a template." };
    if (!sesCredentialId) return { ok: false, error: "Pick SES credentials." };
    if (groupIds.length < 1) return { ok: false, error: "Pick at least one group." };
    const scheduledAt = parseDatetimeLocalValue(scheduledLocal);
    if (!Number.isFinite(scheduledAt)) return { ok: false, error: "Invalid date or time." };
    const subj = subject.trim();
    const tpl = templates.find((t) => t.id === templateId);
    if (!subj && !tpl?.subject) return { ok: false, error: "Subject is required." };
    const cc = splitEmails(ccText);
    const bcc = splitEmails(bccText);
    const payload: CampaignPayloadIn = {
      name: name.trim(),
      template_id: templateId,
      group_ids: groupIds,
      scheduled_at: scheduledAt,
      ses_credential_id: sesCredentialId,
      subject: subj || tpl?.subject || "Campaign",
      variables: parsed.value,
      cc,
      bcc,
      max_retries: 3,
    };
    const fe = fromEmail.trim();
    if (fe) payload.from_email = fe;
    const fn = fromName.trim();
    if (fn) payload.from_name = fn;
    return { ok: true, value: payload };
  }, [
    name,
    templateId,
    sesCredentialId,
    groupIds,
    scheduledLocal,
    subject,
    variablesText,
    ccText,
    bccText,
    fromEmail,
    fromName,
    templates,
  ]);

  const runPreview = useCallback(async () => {
    setPreviewError(null);
    const built = buildPayload();
    if (!built.ok) {
      setPreviewError(built.error);
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await authedFetch("/api/campaigns/preview", {
        method: "POST",
        body: JSON.stringify(built.value),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed.");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [buildPayload]);

  useEffect(() => {
    if (step === 3) void runPreview();
    // Intentionally only when entering preview step (not on every runPreview identity change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function toggleGroup(id: string) {
    setGroupIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CAMPAIGN_GROUPS) {
        setError(`You can select at most ${MAX_CAMPAIGN_GROUPS} groups.`);
        return prev;
      }
      setError(null);
      return [...prev, id];
    });
  }

  async function persistCampaign(): Promise<string | null> {
    const built = buildPayload();
    if (!built.ok) {
      setError(built.error);
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      if (campaignId) {
        const res = await authedFetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          body: JSON.stringify(built.value),
        });
        if (!res.ok) throw new Error(await res.text());
        return campaignId;
      }
      const res = await authedFetch("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(built.value),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { campaign: { id: string } };
      setCampaignId(data.campaign.id);
      return data.campaign.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    await persistCampaign();
  }

  async function scheduleSend() {
    const id = await persistCampaign();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const sendRes = await authedFetch(`/api/campaigns/${id}/send`, { method: "POST" });
      if (!sendRes.ok) throw new Error(await sendRes.text());
      router.push("/app/campaigns");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    setError(null);
    if (step === 0 && groupIds.length < 1) {
      setError("Select at least one group.");
      return;
    }
    if (step === 1) {
      const b = buildPayload();
      if (!b.ok) {
        setError(b.error);
        return;
      }
    }
    if (step === 2 && !scheduledLocal) {
      setError("Pick a date and time.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  const stepTitle = ["Audience", "Message", "Schedule", "Preview"][step] ?? "Preview";

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link href="/app/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
          ← Campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New campaign</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {step + 1} of 4 — {stepTitle}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <CampaignFormSteps
          step={step}
          name={name}
          onName={setName}
          templates={templates}
          templateId={templateId}
          onTemplateId={(v) => {
            setTemplateId(v);
            const t = templates.find((x) => x.id === v);
            if (t) {
              setSubject(t.subject ?? "");
              setVariablesText(JSON.stringify(t.sample_data ?? {}, null, 2));
            }
          }}
          sesCreds={sesCreds}
          sesCredentialId={sesCredentialId}
          onSesCredentialId={(v) => {
            setSesCredentialId(v);
            const c = sesCreds.find((x) => x.id === v);
            if (c?.default_from_email) setFromEmail(c.default_from_email);
          }}
          fromEmail={fromEmail}
          onFromEmail={setFromEmail}
          fromName={fromName}
          onFromName={setFromName}
          subject={subject}
          onSubject={setSubject}
          variablesText={variablesText}
          onVariablesText={setVariablesText}
          ccText={ccText}
          onCcText={setCcText}
          bccText={bccText}
          onBccText={setBccText}
          groups={groups}
          groupIds={groupIds}
          onToggleGroup={toggleGroup}
          scheduledLocal={scheduledLocal}
          onScheduledLocal={setScheduledLocal}
          preview={preview}
          previewLoading={previewLoading}
          previewError={previewError}
        />

        {error ? <div className="mt-4 text-sm text-destructive">{error}</div> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={step === 0 || saving} onClick={back}>
              Back
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={next} disabled={saving}>
                Next
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button type="button" variant="secondary" disabled={saving} onClick={() => void saveDraft()}>
                Save draft
              </Button>
            ) : null}
            {step === 3 ? (
              <Button type="button" disabled={saving} onClick={() => void scheduleSend()}>
                Schedule send
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
