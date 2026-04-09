"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { getTemplate, updateTemplate } from "@/lib/templates/firestore";
import { TemplateEditor } from "../_components/TemplateEditor";
import { defaultTemplateDraft } from "../_components/templateDefaults";
import type { TemplateDoc } from "@/lib/firestore/schema";

type Draft = Omit<TemplateDoc, "created_at" | "updated_at">;

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams<{ templateId: string }>();
  const templateId = params?.templateId ?? "";
  const tenantId = useMemo(() => getActiveTenantId(), []);
  const [initial, setInitial] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      if (!tenantId) {
        setError("No active tenant selected.");
        return;
      }
      if (!templateId) return;
      try {
        const t = await getTemplate({ tenantId, templateId });
        if (!t) {
          setError("Template not found.");
          return;
        }
        const { id: _id, created_at: _c, updated_at: _u, ...rest } = t;
        setInitial(rest);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load template.");
      }
    }
    void load();
  }, [tenantId, templateId]);

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (!initial) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <TemplateEditor
      mode="edit"
      initial={initial ?? defaultTemplateDraft()}
      onCancelHref="/app/templates"
      onSave={async (draft) => {
        const tId = getActiveTenantId();
        if (!tId) throw new Error("No active tenant selected.");
        await updateTemplate({ tenantId: tId, templateId, patch: draft });
        router.refresh();
      }}
    />
  );
}

