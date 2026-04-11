import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getAdminStorageBucket } from "@/lib/firebase/admin";
import { getServerDb } from "@/lib/firestore/server";

/** Parse object path from a Firebase Storage download URL for this API's upload format. */
function objectPathFromFirebaseDownloadUrl(
  url: string,
  expectedBucket: string
): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "firebasestorage.googleapis.com") return null;
    const segs = u.pathname.split("/");
    if (segs.length < 6 || segs[1] !== "v0" || segs[2] !== "b" || segs[4] !== "o") {
      return null;
    }
    const bucket = decodeURIComponent(segs[3]);
    if (bucket !== expectedBucket) return null;
    return decodeURIComponent(segs[5]);
  } catch {
    return null;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { assetId } = await params;
    const db = getServerDb();
    const ref = db
      .collection("tenants")
      .doc(tenantId)
      .collection("assets")
      .doc(assetId);
    const snap = await ref.get();
    if (!snap.exists) return new Response("Not found", { status: 404 });

    const data = snap.data() as { url?: string };
    const url = typeof data.url === "string" ? data.url : "";
    const bucket = getAdminStorageBucket();
    const prefix = `tenants/${tenantId}/`;
    const objectPath = url ? objectPathFromFirebaseDownloadUrl(url, bucket.name) : null;
    if (objectPath?.startsWith(prefix)) {
      await bucket.file(objectPath).delete({ ignoreNotFound: true });
    }

    await ref.delete();
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad request";
    const status = msg === "Not a member of this tenant." ? 403 : 400;
    return new Response(msg, { status });
  }
}
