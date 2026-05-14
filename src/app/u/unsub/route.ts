import { getServerDb, nowMs } from "@/lib/firestore/server";
import { verifySignature } from "@/lib/crypto/signing";
import type { PersonDoc } from "@/lib/firestore/schema";
import {
  unsubscribeAlreadyPage,
  unsubscribeInvalidPage,
  unsubscribeSuccessPage,
} from "@/app/u/unsub/unsubscribe-page-html";

function html(body: string) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("t")?.trim() ?? "";
  const peopleId = searchParams.get("p")?.trim() ?? "";
  const fromRaw = searchParams.get("f")?.trim() ?? "";
  const sig = searchParams.get("sig")?.trim() ?? "";

  if (!tenantId || !peopleId || !sig) {
    return html(unsubscribeInvalidPage());
  }

  const hasFrom = Boolean(fromRaw);
  const ok = hasFrom
    ? verifySignature({ t: tenantId, p: peopleId, f: fromRaw.toLowerCase() }, sig)
    : verifySignature({ t: tenantId, p: peopleId }, sig);
  if (!ok) return html(unsubscribeInvalidPage());

  const db = getServerDb();
  const ref = db.collection("tenants").doc(tenantId).collection("people").doc(peopleId);
  const snap = await ref.get();
  if (!snap.exists) return html(unsubscribeInvalidPage());

  const now = nowMs();
  const data = snap.data() as PersonDoc;
  const fromKey = fromRaw.toLowerCase();

  if (data.unsubscribed_at) {
    return html(unsubscribeAlreadyPage({ fromLabel: fromRaw || undefined }));
  }

  if (hasFrom) {
    const map = { ...(data.unsubscribed_from ?? {}) };
    if (map[fromKey]) {
      return html(unsubscribeAlreadyPage({ fromLabel: fromRaw }));
    }
    map[fromKey] = now;
    await ref.set({ unsubscribed_from: map, updated_at: now }, { merge: true });
  } else {
    await ref.set({ unsubscribed_at: now, updated_at: now }, { merge: true });
  }

  await db.collection("tenants").doc(tenantId).collection("email_events").add({
    type: "unsubscribed",
    provider: "ses",
    job_id: null,
    payload: {
      people_id: peopleId,
      from_email: hasFrom ? fromKey : null,
      scope: hasFrom ? "from_address" : "tenant",
    },
    created_at: now,
  });

  return html(unsubscribeSuccessPage({ fromLabel: hasFrom ? fromRaw : undefined }));
}
