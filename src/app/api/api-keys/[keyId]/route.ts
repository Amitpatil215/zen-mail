import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { keyId } = await params;
    const db = getServerDb();
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("api_keys")
      .doc(keyId)
      .set({ revoked_at: nowMs(), updated_at: nowMs() }, { merge: true });

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

