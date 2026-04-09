import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";

const CreateBody = z.object({
  url: z.string().url(),
  file_name: z.string().min(1).max(200),
  folder: z.string().trim().max(120).default(""),
  content_type: z.string().min(1).max(120),
  size: z.number().int().min(0).max(50_000_000),
});

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);
    const body = CreateBody.parse(await request.json());

    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("assets").doc();
    await ref.set({ ...body, created_at: nowMs() });
    return Response.json({ asset: { id: ref.id } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
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
      .collection("assets")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    const assets = snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }));
    return Response.json({ assets });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

