import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb } from "@/lib/firestore/server";

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
      .collection("email_jobs")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
    const jobs = snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }));
    return Response.json({ jobs });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

