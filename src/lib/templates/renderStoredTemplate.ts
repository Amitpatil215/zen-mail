import { getServerDb } from "@/lib/firestore/server";
import type { TemplateDoc } from "@/lib/firestore/schema";
import { renderLiquid } from "@/lib/templates/liquid";

export async function renderStoredTemplate(
  tenantId: string,
  templateId: string,
  vars: unknown
): Promise<{ subject: string; html: string; text: string | null }> {
  const db = getServerDb();
  const snap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("templates")
    .doc(templateId)
    .get();
  if (!snap.exists) throw new Error("Template not found.");
  const tpl = snap.data() as TemplateDoc;
  const subject = await renderLiquid(tpl.subject, vars);
  const html = await renderLiquid(tpl.body_html, vars);
  const text = tpl.body_text ? await renderLiquid(tpl.body_text, vars) : null;
  return { subject, html, text };
}
