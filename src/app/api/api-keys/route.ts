import { z } from "zod";
import { randomBytes } from "crypto";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { sha256Hex } from "@/lib/crypto/hash";
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
      .collection("api_keys")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    const keys = snaps.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: typeof data["name"] === "string" ? data["name"] : "",
        created_at: typeof data["created_at"] === "number" ? data["created_at"] : null,
        last_used_at:
          typeof data["last_used_at"] === "number" ? data["last_used_at"] : null,
        revoked_at: typeof data["revoked_at"] === "number" ? data["revoked_at"] : null,
      };
    });

    return Response.json({ keys });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

const CreateBody = z.object({
  name: z.string().trim().min(1).max(60),
});

function randomKey() {
  return randomBytes(32).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const body = CreateBody.parse(await request.json());
    const raw = randomKey();
    const now = nowMs();

    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("api_keys").doc();
    await ref.set({
      name: body.name,
      key_hash: sha256Hex(raw),
      created_at: now,
      updated_at: now,
      last_used_at: null,
      revoked_at: null,
    });

    return Response.json({ api_key: { id: ref.id, name: body.name, raw } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

