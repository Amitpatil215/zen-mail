import { requireIdToken } from "@/lib/api/auth";
import { assertGroupIdsForTenant } from "@/lib/api/groupValidation";
import { requireTenantMembership } from "@/lib/api/tenant";
import { CampaignPayload, MAX_CAMPAIGN_RECIPIENTS } from "@/lib/campaigns/campaignPayload";
import { normalizeCampaignRaw } from "@/lib/campaigns/normalizeCampaignRaw";
import { loadGroupSummaries } from "@/lib/campaigns/loadGroupSummaries";
import { loadRecipientsForGroups } from "@/lib/campaigns/loadRecipientsForGroups";
import { mergePersonVariables } from "@/lib/campaigns/mergePersonVariables";
import { getServerDb } from "@/lib/firestore/server";
import type { TemplateDoc } from "@/lib/firestore/schema";
import { mergePreviewSystemVariables } from "@/lib/email/enrichEmailJobVariables";
import { renderStoredTemplate } from "@/lib/templates/renderStoredTemplate";

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const raw = await request.json();
    normalizeCampaignRaw(raw);
    const body = CampaignPayload.parse(raw);
    const db = getServerDb();
    await assertGroupIdsForTenant(db, tenantId, body.group_ids);

    const tplSnap = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("templates")
      .doc(body.template_id)
      .get();
    if (!tplSnap.exists) return new Response("Template not found.", { status: 400 });
    const tpl = tplSnap.data() as TemplateDoc;

    const recipients = await loadRecipientsForGroups({
      db,
      tenantId,
      groupIds: body.group_ids,
      fromEmail: body.from_email,
    });

    if (recipients.length > MAX_CAMPAIGN_RECIPIENTS) {
      return new Response(
        `Too many recipients (${recipients.length}). Narrow groups (max ${MAX_CAMPAIGN_RECIPIENTS}).`,
        { status: 400 }
      );
    }

    const groups = await loadGroupSummaries(db, tenantId, body.group_ids);
    const sample = recipients.slice(0, 12).map((r) => ({
      email: r.email,
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
    }));

    let rendered_html: string | null = null;
    if (recipients[0]) {
      const vars = mergePreviewSystemVariables({
        tenantId,
        fromEmail: body.from_email ?? null,
        recipient: recipients[0],
        variables: mergePersonVariables(body.variables, recipients[0]),
      });
      const rendered = await renderStoredTemplate(tenantId, body.template_id, vars);
      rendered_html = rendered.html;
    }

    return Response.json({
      recipient_count: recipients.length,
      recipients_sample: sample,
      groups,
      template: { id: body.template_id, name: tpl.name, subject: tpl.subject },
      scheduled_at: body.scheduled_at,
      track_email_open: body.track_email_open,
      rendered_html,
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", { status: 400 });
  }
}
