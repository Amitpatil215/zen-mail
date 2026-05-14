import { z } from "zod";
import { assertGroupIdsForTenant } from "@/lib/api/groupValidation";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";

const PatchBody = z
  .object({
    email: z.string().email().optional(),
    first_name: z.string().trim().max(60).optional(),
    last_name: z.string().trim().max(60).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).optional(),
    group_ids: z.array(z.string().trim().min(1)).optional(),
    unsubscribed_at: z.number().int().nullable().optional(),
    unsubscribed_from: z
      .record(z.string().trim().min(1).max(254), z.number().int())
      .optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update." });

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ personId: string }> }
) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { personId } = await ctx.params;
    if (!personId?.trim()) return new Response("Missing person id", { status: 400 });

    const body = PatchBody.parse(await request.json());
    const db = getServerDb();
    const ref = db
      .collection("tenants")
      .doc(tenantId)
      .collection("people")
      .doc(personId);

    const snap = await ref.get();
    if (!snap.exists) return new Response("Not found", { status: 404 });

    if (body.group_ids) {
      await assertGroupIdsForTenant(db, tenantId, body.group_ids);
    }

    const patch: Record<string, unknown> = { updated_at: nowMs() };
    if (body.email !== undefined) patch.email = body.email.toLowerCase();
    if (body.first_name !== undefined) patch.first_name = body.first_name;
    if (body.last_name !== undefined) patch.last_name = body.last_name;
    if (body.tags !== undefined) patch.tags = body.tags;
    if (body.group_ids !== undefined) patch.group_ids = body.group_ids;
    if (body.unsubscribed_at !== undefined) {
      patch.unsubscribed_at = body.unsubscribed_at;
    }
    if (body.unsubscribed_from !== undefined) {
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(body.unsubscribed_from)) {
        next[k.trim().toLowerCase()] = v;
      }
      patch.unsubscribed_from = next;
    }

    await ref.update(patch);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad request";
    const status = msg === "Not found" ? 404 : 400;
    return new Response(msg, { status });
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ personId: string }> }
) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { personId } = await ctx.params;
    if (!personId?.trim()) return new Response("Missing person id", { status: 400 });

    const db = getServerDb();
    const ref = db
      .collection("tenants")
      .doc(tenantId)
      .collection("people")
      .doc(personId);

    const snap = await ref.get();
    if (!snap.exists) return new Response("Not found", { status: 404 });

    await ref.delete();
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad request";
    const status = msg === "Not found" ? 404 : 400;
    return new Response(msg, { status });
  }
}
