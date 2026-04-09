import { getServerDb } from "@/lib/firestore/server";

export async function requireTenantId(request: Request): Promise<string> {
  const tenantId = request.headers.get("x-tenant-id")?.trim();
  if (!tenantId) throw new Error("Missing x-tenant-id header.");

  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) throw new Error("Missing Authorization Bearer token.");

  // The caller should have already verified token; but re-check membership safely.
  // We avoid importing admin auth here to keep dependency direction simple.
  // Membership validation is done by verifying the existence of the membership doc.
  // `requireIdToken` runs in the route handler and yields the uid.
  return tenantId;
}

export async function requireTenantMembership(tenantId: string, uid: string) {
  const db = getServerDb();
  const memberSnap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("members")
    .doc(uid)
    .get();
  if (!memberSnap.exists) throw new Error("Not a member of this tenant.");
}

