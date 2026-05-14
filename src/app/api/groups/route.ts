import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { GroupDoc } from "@/lib/firestore/schema";
import {
  getOrCreateDefaultGroupId,
  migratePeopleGroupIdsIfNeeded,
} from "@/lib/firestore/tenantGroups";

export async function GET(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const db = getServerDb();
    const defaultId = await getOrCreateDefaultGroupId(db, tenantId);
    await migratePeopleGroupIdsIfNeeded(db, tenantId, defaultId);

    const snaps = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("groups")
      .orderBy("created_at", "asc")
      .get();

    const groups = snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as GroupDoc),
    }));
    return Response.json({ groups });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

const PostBody = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const body = PostBody.parse(await request.json());
    const now = nowMs();
    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("groups").doc();
    const doc: GroupDoc = {
      name: body.name,
      is_default: false,
      created_at: now,
      updated_at: now,
    };
    await ref.set(doc);
    return Response.json({ group: { id: ref.id, ...doc } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}
