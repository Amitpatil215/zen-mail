import { getServerDb, nowMs } from "@/lib/firestore/server";
import { verifySignature } from "@/lib/crypto/signing";

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
  if (ok) {
    const db = getServerDb();
    const now = nowMs();
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("email_events")
      .add({
        type: "opened",
        provider: "ses",
        job_id: jobId,
        payload: { path: "t/open" },
        created_at: now,
      });
  }

  return new Response(GIF_1X1, {
    headers: { "content-type": "image/gif", "cache-control": "no-store" },
  });
}

