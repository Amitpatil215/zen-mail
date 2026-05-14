import { requireIdToken } from "@/lib/api/auth";
import { assertGroupIdsForTenant } from "@/lib/api/groupValidation";
import { requireTenantMembership } from "@/lib/api/tenant";
import { CampaignPayload } from "@/lib/campaigns/campaignPayload";
import { normalizeCampaignRaw } from "@/lib/campaigns/normalizeCampaignRaw";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { CampaignDoc } from "@/lib/firestore/schema";

function normalizeFromEmail(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

export async function GET(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const db = getServerDb();
    const snaps = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("campaigns")
      .orderBy("created_at", "desc")
      .limit(80)
      .get();

    const campaigns = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as CampaignDoc) }));
    return Response.json({ campaigns });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", { status: 401 });
  }
}

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

    const now = nowMs();
    const ref = db.collection("tenants").doc(tenantId).collection("campaigns").doc();
    const doc: CampaignDoc = {
      name: body.name,
      status: "draft",
      template_id: body.template_id,
      group_ids: body.group_ids,
      scheduled_at: body.scheduled_at,
      ses_credential_id: body.ses_credential_id,
      from_email: normalizeFromEmail(body.from_email ?? null),
      from_name: body.from_name?.trim() || null,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      variables: body.variables,
      max_retries: body.max_retries,
      recipient_count: null,
      launched_at: null,
      created_at: now,
      updated_at: now,
    };
    await ref.set(doc);
    return Response.json({ campaign: { id: ref.id, ...doc } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", { status: 400 });
  }
}
