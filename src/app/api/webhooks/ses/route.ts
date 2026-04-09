import { z } from "zod";
import { getServerDb, nowMs } from "@/lib/firestore/server";

const Body = z.record(z.string(), z.unknown());

function requireWebhookSecret(request: Request) {
  const expected = process.env.SES_WEBHOOK_SECRET;
  if (!expected) throw new Error("SES_WEBHOOK_SECRET not configured.");
  const got = request.headers.get("x-webhook-secret");
  if (!got || got !== expected) throw new Error("Unauthorized webhook.");
}

function getTenantIdFromRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("tenant_id")?.trim() || null;
}

function extractSesMessageId(payload: Record<string, unknown>) {
  const mail = payload["mail"];
  if (mail && typeof mail === "object") {
    const messageId = (mail as Record<string, unknown>)["messageId"];
    if (typeof messageId === "string" && messageId) return messageId;
  }
  return null;
}

function mapType(payload: Record<string, unknown>) {
  const t = payload["notificationType"];
  if (t === "Delivery") return "delivered";
  if (t === "Bounce") return "bounced";
  if (t === "Complaint") return "complaint";
  return "delivered";
}

export async function POST(request: Request) {
  try {
    requireWebhookSecret(request);
    const tenantId = getTenantIdFromRequest(request);
    if (!tenantId) return new Response("Missing tenant_id", { status: 400 });

    const raw = Body.parse(await request.json());
    const payload = raw as Record<string, unknown>;
    const sesMessageId = extractSesMessageId(payload);
    const type = mapType(payload);

    const db = getServerDb();
    const now = nowMs();

    let jobId: string | null = null;
    if (sesMessageId) {
      const jobs = await db
        .collection("tenants")
        .doc(tenantId)
        .collection("email_jobs")
        .where("ses_message_id", "==", sesMessageId)
        .limit(1)
        .get();
      jobId = jobs.docs[0]?.id ?? null;
    }

    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("email_events")
      .add({
        type,
        provider: "ses",
        ses_message_id: sesMessageId,
        job_id: jobId,
        payload,
        created_at: now,
      });

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

