import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";

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
      .collection("people")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
    const people = snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }));
    return Response.json({ people });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

const CreateBody = z.object({
  email: z.string().email(),
  first_name: z.string().trim().max(60).optional(),
  last_name: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const body = CreateBody.parse(await request.json());
    const now = nowMs();
    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("people").doc();
    await ref.set({
      email: body.email.toLowerCase(),
      first_name: body.first_name ?? "",
      last_name: body.last_name ?? "",
      tags: body.tags,
      custom: {},
      unsubscribed_at: null,
      created_at: now,
      updated_at: now,
    });
    return Response.json({ person: { id: ref.id } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

