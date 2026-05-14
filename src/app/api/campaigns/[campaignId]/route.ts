import { requireIdToken } from "@/lib/api/auth";
import { assertGroupIdsForTenant } from "@/lib/api/groupValidation";
import { requireTenantMembership } from "@/lib/api/tenant";
import { CampaignPatch } from "@/lib/campaigns/campaignPayload";
import { normalizeCampaignRaw } from "@/lib/campaigns/normalizeCampaignRaw";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { CampaignDoc } from "@/lib/firestore/schema";

function normalizeFromEmail(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t ? t : null;
}

type RouteCtx = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  try {
    const user = await requireIdToken(_request);
    const tenantId = _request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { campaignId } = await ctx.params;
    const db = getServerDb();
    const snap = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("campaigns")
      .doc(campaignId)
      .get();
    if (!snap.exists) return new Response("Not found", { status: 404 });
    return Response.json({ campaign: { id: snap.id, ...(snap.data() as CampaignDoc) } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", { status: 401 });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { campaignId } = await ctx.params;
    const raw = await request.json();
    normalizeCampaignRaw(raw);
    const patch = CampaignPatch.parse(raw);
    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("campaigns").doc(campaignId);
    const snap = await ref.get();
    if (!snap.exists) return new Response("Not found", { status: 404 });
    const cur = snap.data() as CampaignDoc;
    if (cur.status !== "draft") {
      return new Response("Only draft campaigns can be edited.", { status: 409 });
    }

    if (patch.group_ids?.length) {
      await assertGroupIdsForTenant(db, tenantId, patch.group_ids);
    }

    if (patch.template_id) {
      const tplSnap = await db
        .collection("tenants")
        .doc(tenantId)
        .collection("templates")
        .doc(patch.template_id)
        .get();
      if (!tplSnap.exists) return new Response("Template not found.", { status: 400 });
    }

    const now = nowMs();
    const next: CampaignDoc = {
      ...cur,
      ...patch,
      from_email:
        patch.from_email !== undefined ? normalizeFromEmail(patch.from_email) : cur.from_email,
      from_name: patch.from_name !== undefined ? patch.from_name?.trim() || null : cur.from_name,
      updated_at: now,
    };

    await ref.set(next);
    return Response.json({ campaign: { id: ref.id, ...next } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", { status: 400 });
  }
}
