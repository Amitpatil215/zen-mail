import { getServerDb, nowMs } from "@/lib/firestore/server";
import { verifySignature } from "@/lib/crypto/signing";

function html(body: string) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Unsubscribe</title></head><body style="font-family: ui-sans-serif, system-ui; padding: 32px;">${body}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("t")?.trim() ?? "";
  const peopleId = searchParams.get("p")?.trim() ?? "";
  const sig = searchParams.get("sig")?.trim() ?? "";

  if (!tenantId || !peopleId || !sig) {
    return html("<h1>Invalid unsubscribe link</h1>");
  }

  const ok = verifySignature({ t: tenantId, p: peopleId }, sig);
  if (!ok) return html("<h1>Invalid unsubscribe link</h1>");

  const db = getServerDb();
  const now = nowMs();
  await db
    .collection("tenants")
    .doc(tenantId)
    .collection("people")
    .doc(peopleId)
    .set({ unsubscribed_at: now, updated_at: now }, { merge: true });

  await db.collection("tenants").doc(tenantId).collection("email_events").add({
    type: "unsubscribed",
    provider: "ses",
    job_id: null,
    payload: { people_id: peopleId },
    created_at: now,
  });

  return html("<h1>You have been unsubscribed.</h1><p>You will no longer receive emails from this tenant.</p>");
}

