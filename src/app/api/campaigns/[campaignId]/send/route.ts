import { requireIdToken } from "@/lib/api/auth";
import { assertGroupIdsForTenant } from "@/lib/api/groupValidation";
import { requireTenantMembership } from "@/lib/api/tenant";
import { MAX_CAMPAIGN_RECIPIENTS } from "@/lib/campaigns/campaignPayload";
import { loadRecipientsForGroups } from "@/lib/campaigns/loadRecipientsForGroups";
import { writeCampaignEmailJobs } from "@/lib/campaigns/writeCampaignEmailJobs";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { CampaignDoc } from "@/lib/firestore/schema";

export const maxDuration = 60;

type RouteCtx = { params: Promise<{ campaignId: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { campaignId } = await ctx.params;
    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("campaigns").doc(campaignId);
    const snap = await ref.get();
    if (!snap.exists) return new Response("Not found", { status: 404 });
    const campaign = snap.data() as CampaignDoc;

    if (campaign.status !== "draft") {
      return new Response("Campaign already launched.", { status: 409 });
    }

    await assertGroupIdsForTenant(db, tenantId, campaign.group_ids);

    const tplSnap = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("templates")
      .doc(campaign.template_id)
      .get();
    if (!tplSnap.exists) return new Response("Template not found.", { status: 400 });

    const credSnap = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("ses_credentials")
      .doc(campaign.ses_credential_id ?? "")
      .get();
    if (!campaign.ses_credential_id || !credSnap.exists) {
      return new Response("SES credentials not found.", { status: 400 });
    }

    const recipients = await loadRecipientsForGroups({
      db,
      tenantId,
      groupIds: campaign.group_ids,
      fromEmail: campaign.from_email,
    });

    if (recipients.length > MAX_CAMPAIGN_RECIPIENTS) {
      return new Response(
        `Too many recipients (${recipients.length}). Max ${MAX_CAMPAIGN_RECIPIENTS}.`,
        { status: 400 }
      );
    }
    if (!recipients.length) {
      return new Response("No subscribed recipients in the selected groups.", { status: 400 });
    }

    const now = nowMs();
    const scheduledAt = Math.max(campaign.scheduled_at, now);

    const { created } = await writeCampaignEmailJobs({
      db,
      tenantId,
      campaignId,
      scheduledAt,
      templateId: campaign.template_id,
      sesCredentialId: campaign.ses_credential_id,
      fromEmail: campaign.from_email,
      fromName: campaign.from_name,
      cc: campaign.cc,
      bcc: campaign.bcc,
      subject: campaign.subject,
      baseVariables: campaign.variables,
      maxRetries: campaign.max_retries,
      trackEmailOpen: campaign.track_email_open === true,
      recipients,
    });

    await ref.update({
      status: "launched",
      recipient_count: created,
      launched_at: now,
      scheduled_at: scheduledAt,
      updated_at: now,
    });

    return Response.json({
      ok: true,
      jobs_created: created,
      scheduled_at: scheduledAt,
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", { status: 400 });
  }
}
