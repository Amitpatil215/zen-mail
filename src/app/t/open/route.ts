import { getServerDb, nowMs } from "@/lib/firestore/server";
import { verifySignature } from "@/lib/crypto/signing";
import type { EmailJobDoc } from "@/lib/firestore/schema";

const GIF_1X1 = Buffer.from(
  "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("t")?.trim() ?? "";
  const jobId = searchParams.get("j")?.trim() ?? "";
  const sig = searchParams.get("sig")?.trim() ?? "";

  if (!tenantId || !jobId || !sig) {
    return new Response(GIF_1X1, {
      headers: { "content-type": "image/gif", "cache-control": "no-store" },
    });
  }

  const ok = verifySignature({ t: tenantId, j: jobId }, sig);
  if (!ok) {
    return new Response(GIF_1X1, {
      headers: { "content-type": "image/gif", "cache-control": "no-store" },
    });
  }

  const db = getServerDb();
  const now = nowMs();
  const jobRef = db.collection("tenants").doc(tenantId).collection("email_jobs").doc(jobId);

  const firstOpen = await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) return false;
    const data = snap.data() as EmailJobDoc;
    if (data.track_email_open !== true || data.email_opened === true) return false;
    tx.update(jobRef, {
      email_opened: true,
      email_opened_at: now,
      updated_at: now,
    });
    return true;
  });

  if (firstOpen) {
    await db.collection("tenants").doc(tenantId).collection("email_events").add({
      type: "opened",
      provider: "ses",
      job_id: jobId,
      ses_message_id: null,
      payload: { path: "t/open" },
      created_at: now,
    });
  }

  return new Response(GIF_1X1, {
    headers: { "content-type": "image/gif", "cache-control": "no-store" },
  });
}
