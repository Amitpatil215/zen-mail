"use client";

import { useState } from "react";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { useTemplates } from "@/lib/templates/useTemplates";
import { TemplateEditorPanel } from "./TemplateEditorPanel";
import { TemplateListPanel } from "./TemplateListPanel";
import { TemplatePreviewPanel } from "./TemplatePreviewPanel";
import { useTemplateDraft } from "./useTemplateDraft";

export default function TemplatesPage() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const tenantId = getActiveTenantId();
  const { templates, error: listError } = useTemplates(tenantId);
  const [selectedId, setSelectedId] = useState<string | "new">("new");

  const draft = useTemplateDraft({ tenantId, templates, selectedId, setSelectedId });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and preview templates with sample variables (Liquid).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <TemplateListPanel
          templates={templates}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          error={listError}
          disabled={draft.busy !== null}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <TemplateEditorPanel
            name={draft.name}
            setName={draft.setName}
            subject={draft.subject}
            setSubject={draft.setSubject}
            labels={draft.labels}
            setLabels={draft.setLabels}
            bodyHtml={draft.bodyHtml}
            setBodyHtml={draft.setBodyHtml}
            bodyText={draft.bodyText}
            setBodyText={draft.setBodyText}
            sampleJson={draft.sampleJson}
            setSampleJson={draft.setSampleJson}
            error={draft.error}
            requiredVars={draft.requiredVars}
            missingVars={draft.missingVars}
            autoRender={draft.autoRender}
            setAutoRender={draft.setAutoRender}
            busy={draft.busy}
            canDelete={selectedId !== "new"}
            onRenderNow={() => void draft.renderNow()}
            onPopulateJson={draft.populateJson}
            onSave={() => void draft.save()}
            onDelete={() => void draft.remove()}
          />

          <TemplatePreviewPanel
            mode={mode}
            setMode={setMode}
            renderedHtml={draft.rendered}
            fallbackHtml={draft.bodyHtml}
          />
        </div>
      </div>
    </div>
  );
}

