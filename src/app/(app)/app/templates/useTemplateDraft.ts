"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TemplateDoc } from "@/lib/firestore/schema";
import type { TemplateRow } from "@/lib/templates/firestoreClient";
import { createTemplate, deleteTemplate, updateTemplate } from "@/lib/templates/firestoreClient";
import { populateSampleDataJson } from "@/lib/templates/sampleData";
import { renderLiquid } from "@/lib/templates/liquid";
import { findMissingLiquidVariables, listLiquidVariables } from "@/lib/templates/variables";
import { toTemplateDraftDoc } from "./templateDraftUtils";

export const DEFAULT_TEMPLATE: Pick<
  TemplateDoc,
  "name" | "subject" | "body_html" | "body_text" | "labels" | "sample_data"
> = {
  name: "Welcome",
  subject: "Welcome, {{ person.first_name }}",
  body_html:
    "<!-- HTML template -->\n<h1>Hello {{ person.first_name }}</h1>\n<p>Welcome to Zen Mail.</p>\n",
  body_text: "Hello {{ person.first_name }},\n\nWelcome to Zen Mail.\n",
  labels: ["welcome"],
  sample_data: { person: { first_name: "Taylor" } },
};

export function useTemplateDraft(params: {
  tenantId: string | null;
  templates: TemplateRow[];
  selectedId: string | "new";
  setSelectedId: (id: string | "new") => void;
}) {
  const [name, setName] = useState(DEFAULT_TEMPLATE.name);
  const [subject, setSubject] = useState(DEFAULT_TEMPLATE.subject);
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_TEMPLATE.body_html);
  const [bodyText, setBodyText] = useState(DEFAULT_TEMPLATE.body_text ?? "");
  const [labels, setLabels] = useState(DEFAULT_TEMPLATE.labels.join(", "));
  const [sampleJson, setSampleJson] = useState(JSON.stringify(DEFAULT_TEMPLATE.sample_data, null, 2));

  const [rendered, setRendered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiredVars, setRequiredVars] = useState<string[]>([]);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const [autoRender, setAutoRender] = useState(true);
  const [busy, setBusy] = useState<null | "saving" | "deleting">(null);

  const lastReqId = useRef(0);

  const selectedTemplate = useMemo(() => {
    if (params.selectedId === "new") return null;
    return params.templates.find((t) => t.id === params.selectedId) ?? null;
  }, [params.selectedId, params.templates]);

  useEffect(() => {
    if (!selectedTemplate) return;
    setName(selectedTemplate.name ?? "");
    setSubject(selectedTemplate.subject ?? "");
    setBodyHtml(selectedTemplate.body_html ?? "");
    setBodyText(selectedTemplate.body_text ?? "");
    setLabels((selectedTemplate.labels ?? []).join(", "));
    setSampleJson(JSON.stringify(selectedTemplate.sample_data ?? {}, null, 2));
    setRendered(null);
    setError(null);
    setRequiredVars([]);
    setMissingVars([]);
  }, [selectedTemplate]);

  const combinedForVars = useMemo(() => [subject, bodyHtml, bodyText].filter(Boolean).join("\n"), [
    subject,
    bodyHtml,
    bodyText,
  ]);

  async function renderNow(opts?: { silent?: boolean }) {
    setError(null);
    setRendered(null);
    try {
      let data: unknown;
      try {
        data = JSON.parse(sampleJson || "{}");
      } catch {
        throw new Error("Sample data must be valid JSON.");
      }
      const reqId = ++lastReqId.current;
      const req = listLiquidVariables(combinedForVars);
      const missing = findMissingLiquidVariables(combinedForVars, data);
      setRequiredVars(req);
      setMissingVars(missing);
      const outHtml = await renderLiquid(bodyHtml, data);
      if (reqId !== lastReqId.current) return;
      setRendered(outHtml);
    } catch (e) {
      if (opts?.silent) return;
      setError(e instanceof Error ? e.message : "Failed to render template.");
    }
  }

  function populateJson() {
    const required = requiredVars.length ? requiredVars : listLiquidVariables(combinedForVars);
    if (!required.length) return;
    let existing: unknown = {};
    try {
      existing = JSON.parse(sampleJson || "{}");
    } catch {
      existing = {};
    }
    const out = populateSampleDataJson({ requiredVars: required, existingData: existing });
    setSampleJson(JSON.stringify(out, null, 2));
  }

  async function save() {
    setError(null);
    if (!params.tenantId) {
      setError("No active tenant selected.");
      return;
    }
    setBusy("saving");
    try {
      const doc = toTemplateDraftDoc({ name, subject, bodyHtml, bodyText, labels, sampleJson });
      if (params.selectedId === "new") {
        const id = await createTemplate({ tenantId: params.tenantId, doc });
        params.setSelectedId(id);
      } else {
        await updateTemplate({ tenantId: params.tenantId, templateId: params.selectedId, patch: doc });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save template.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setError(null);
    if (!params.tenantId) {
      setError("No active tenant selected.");
      return;
    }
    if (params.selectedId === "new") return;
    const ok = window.confirm("Delete this template?");
    if (!ok) return;
    setBusy("deleting");
    try {
      await deleteTemplate({ tenantId: params.tenantId, templateId: params.selectedId });
      params.setSelectedId("new");
      setName(DEFAULT_TEMPLATE.name);
      setSubject(DEFAULT_TEMPLATE.subject);
      setBodyHtml(DEFAULT_TEMPLATE.body_html);
      setBodyText(DEFAULT_TEMPLATE.body_text ?? "");
      setLabels(DEFAULT_TEMPLATE.labels.join(", "));
      setSampleJson(JSON.stringify(DEFAULT_TEMPLATE.sample_data, null, 2));
      setRendered(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete template.");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!autoRender) return;
    const t = window.setTimeout(() => void renderNow({ silent: true }), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRender, subject, bodyHtml, bodyText, sampleJson]);

  return {
    name,
    setName,
    subject,
    setSubject,
    bodyHtml,
    setBodyHtml,
    bodyText,
    setBodyText,
    labels,
    setLabels,
    sampleJson,
    setSampleJson,
    rendered,
    error,
    requiredVars,
    missingVars,
    autoRender,
    setAutoRender,
    busy,
    renderNow,
    populateJson,
    save,
    remove,
  };
}

