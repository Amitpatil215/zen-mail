import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb } from "@/lib/firestore/server";
import type { EmailJobDoc } from "@/lib/firestore/schema";

function isForceDelete(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force")?.trim();
  return force === "1" || force === "true";
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const { jobId } = await params;
    const db = getServerDb();
    const ref = db.collection("tenants").doc(tenantId).collection("email_jobs").doc(jobId);

    const snap = await ref.get();
    if (!snap.exists) return new Response("Job not found", { status: 404 });

    const job = snap.data() as EmailJobDoc;
    if (job.status === "processing" && !isForceDelete(request)) {
      return new Response("Job is processing; retry with ?force=1", { status: 409 });
    }

    await ref.delete();
    return Response.json({ ok: true });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

