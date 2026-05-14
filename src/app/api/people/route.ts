import { FieldPath, type Query } from "firebase-admin/firestore";
import { z } from "zod";
import { assertGroupIdsForTenant } from "@/lib/api/groupValidation";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import { getOrCreateDefaultGroupId } from "@/lib/firestore/tenantGroups";

function parseCursor(raw: string | null): { created_at: number; id: string } | null {
  if (!raw?.trim()) return null;
  try {
    const j = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as Record<string, unknown>;
    const created_at = o.created_at;
    const id = o.id;
    if (typeof created_at !== "number" || typeof id !== "string") return null;
    return { created_at, id };
  } catch {
    return null;
  }
}

function encodeCursor(created_at: number, id: string): string {
  return Buffer.from(JSON.stringify({ created_at, id }), "utf8").toString(
    "base64url"
  );
}

const PersonRow = z.object({
  email: z.string().email(),
  first_name: z.string().trim().max(60).optional(),
  last_name: z.string().trim().max(60).optional(),
});

const CreateSingleBody = PersonRow.extend({
  tags: z.array(z.string().trim().min(1).max(40)).optional().default([]),
  group_ids: z.array(z.string().trim().min(1)).optional(),
});

const CreateBulkBody = z.object({
  people: z.array(PersonRow).min(1).max(50),
  group_ids: z.array(z.string().trim().min(1)).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const url = new URL(request.url);
    const pageSize = Math.min(
      Math.max(Number(url.searchParams.get("page_size") ?? 12) || 12, 1),
      50
    );
    const groupsRaw = url.searchParams.get("groups");
    const groupFilterIds =
      groupsRaw
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10) ?? [];
    const cursor = parseCursor(url.searchParams.get("cursor"));

    const db = getServerDb();
    const base = db.collection("tenants").doc(tenantId).collection("people");

    let q: Query = base;
    if (groupFilterIds.length) {
      q = q.where("group_ids", "array-contains-any", groupFilterIds);
    }
    q = q
      .orderBy("created_at", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(pageSize + 1);

    if (cursor) {
      q = q.startAfter(cursor.created_at, cursor.id);
    }

    const snaps = await q.get();
    const hasMore = snaps.docs.length > pageSize;
    const slice = hasMore ? snaps.docs.slice(0, pageSize) : snaps.docs;
    const people = slice.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, unknown>),
    }));
    const last = slice[slice.length - 1];
    const next_cursor =
      hasMore && last
        ? encodeCursor(last.get("created_at") as number, last.id)
        : null;

    return Response.json({ people, next_cursor });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const raw = await request.json();
    const db = getServerDb();
    const now = nowMs();
    const defaultGroupId = await getOrCreateDefaultGroupId(db, tenantId);

    if (raw && typeof raw === "object" && Array.isArray((raw as { people?: unknown }).people)) {
      const body = CreateBulkBody.parse(raw);
      const groupIds =
        body.group_ids?.length ? body.group_ids : [defaultGroupId];
      await assertGroupIdsForTenant(db, tenantId, groupIds);

      const batch = db.batch();
      const created: string[] = [];
      for (const row of body.people) {
        const ref = db
          .collection("tenants")
          .doc(tenantId)
          .collection("people")
          .doc();
        batch.set(ref, {
          email: row.email.toLowerCase(),
          first_name: row.first_name ?? "",
          last_name: row.last_name ?? "",
          tags: [],
          group_ids: groupIds,
          custom: {},
          unsubscribed_at: null,
          created_at: now,
          updated_at: now,
        });
        created.push(ref.id);
      }
      await batch.commit();
      return Response.json({ ids: created, count: created.length });
    }

    const body = CreateSingleBody.parse(raw);
    const groupIds =
      body.group_ids?.length ? body.group_ids : [defaultGroupId];
    await assertGroupIdsForTenant(db, tenantId, groupIds);

    const ref = db.collection("tenants").doc(tenantId).collection("people").doc();
    await ref.set({
      email: body.email.toLowerCase(),
      first_name: body.first_name ?? "",
      last_name: body.last_name ?? "",
      tags: body.tags,
      group_ids: groupIds,
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
