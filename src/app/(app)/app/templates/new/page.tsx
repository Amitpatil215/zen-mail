"use client";

import { useRouter } from "next/navigation";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { createTemplate } from "@/lib/templates/firestore";
import { TemplateEditor } from "../_components/TemplateEditor";
import { defaultTemplateDraft } from "../_components/templateDefaults";

export default function NewTemplatePage() {
  const router = useRouter();

  return (
    <TemplateEditor
      mode="create"
      initial={defaultTemplateDraft()}
      onCancelHref="/app/templates"
      onSave={async (draft) => {
        const tenantId = getActiveTenantId();
        if (!tenantId) throw new Error("No active tenant selected.");
        const res = await createTemplate({ tenantId, doc: draft });
        router.replace(`/app/templates/${res.id}`);
      }}
    />
  );
}

