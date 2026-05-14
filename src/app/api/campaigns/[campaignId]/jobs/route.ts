import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb } from "@/lib/firestore/server";
import type { EmailJobDoc } from "@/lib/firestore/schema";

type RouteCtx = { params: Promise<{ campaignId: string }> };

const MAX_ROWS = 3000;

export async function GET(_request: Request, ctx: RouteCtx) {
  try {
    const user = await requireIdToken(_request);
    const tenantId = _request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { campaignId } = await ctx.params;
    const db = getServerDb();
    const campRef = db.collection("tenants").doc(tenantId).collection("campaigns").doc(campaignId);
    const campSnap = await campRef.get();
    if (!campSnap.exists) return new Response("Not found", { status: 404 });

    const snaps = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("email_jobs")
      .where("campaign_id", "==", campaignId)
      .orderBy("created_at", "desc")
      .limit(MAX_ROWS)
      .get();

    const jobs = snaps.docs.map((d) => {
      const data = d.data() as EmailJobDoc;
      const email = (data.to && data.to[0]) || "";
      return {
        job_id: d.id,
        email,
        status: data.status,
        scheduled_at: data.scheduled_at,
        updated_at: data.updated_at,
        track_email_open: data.track_email_open === true,
        email_opened: data.email_opened === true,
        email_opened_at: data.email_opened_at ?? null,
      };
    });

    return Response.json({ jobs });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", { status: 401 });
  }
}
