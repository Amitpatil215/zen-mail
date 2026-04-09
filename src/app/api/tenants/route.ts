import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { TenantDoc, UserTenantDoc } from "@/lib/firestore/schema";

export async function GET(request: Request) {
  try {
    const user = await requireIdToken(request);
    const db = getServerDb();

    const memberships = await db
      .collection("user_tenant")
      .where("user_id", "==", user.uid)
      .get();

    const tenantIds = memberships.docs
      .map((d) => d.get("tenant_id") as string)
      .filter(Boolean);

    const tenants: Array<{ id: string; name: string }> = [];
    for (const tenantId of tenantIds) {
      const snap = await db.collection("tenants").doc(tenantId).get();
      if (!snap.exists) continue;
      tenants.push({ id: snap.id, name: (snap.data() as TenantDoc).name });
    }

    return Response.json({ tenants });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

const CreateTenantBody = z.object({
  name: z.string().trim().min(1).max(80).default("My Org"),
});

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const body = CreateTenantBody.parse(await request.json().catch(() => ({})));
    const db = getServerDb();
    const now = nowMs();

    const tenantRef = db.collection("tenants").doc();
    const tenantDoc: TenantDoc = {
      name: body.name || "My Org",
      created_at: now,
      updated_at: now,
    };

    const membershipRef = db.collection("user_tenant").doc();
    const membershipDoc: UserTenantDoc = {
      user_id: user.uid,
      tenant_id: tenantRef.id,
      role: "owner",
      created_at: now,
      updated_at: now,
    };

    await db.runTransaction(async (tx) => {
      tx.set(tenantRef, tenantDoc);
      tx.set(membershipRef, membershipDoc);
      tx.set(
        tenantRef.collection("members").doc(user.uid),
        {
          role: "owner",
          created_at: now,
          updated_at: now,
        },
        { merge: true }
      );
      tx.set(db.collection("users").doc(user.uid), {
        email: user.email ?? null,
        updated_at: now,
      }, { merge: true });
    });

    return Response.json({ tenant: { id: tenantRef.id, name: tenantDoc.name } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bad request";
    return new Response(message, { status: 400 });
  }
}

