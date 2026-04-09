import { z } from "zod";
import { ApiKeyAuthError, verifyTenantApiKey } from "@/lib/api/apiKey";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { EmailJobDoc, EmailJobType } from "@/lib/firestore/schema";
import { sha256Hex } from "@/lib/crypto/hash";

const Body = z.object({
  tenant_id: z.string().trim().min(1),
  type: z.enum(["template", "raw_html", "raw_text"] satisfies [EmailJobType, ...EmailJobType[]]),
  template_id: z.string().trim().min(1).optional(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().trim().min(1).max(200),
  raw_html: z.string().optional(),
  raw_text: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional().default({}),
  scheduled_at: z.number().int().optional(),
  idempotency_key: z.string().trim().min(8).max(200),
  max_retries: z.number().int().min(0).max(10).optional().default(3),
});

export async function POST(request: Request) {
  try {
    const rawKey = request.headers.get("x-api-key")?.trim();
    if (!rawKey) return new Response("Missing x-api-key", { status: 401 });
    const body = Body.parse(await request.json());
    try {
      await verifyTenantApiKey(body.tenant_id, rawKey);
    } catch (e) {
      if (e instanceof ApiKeyAuthError) {
        return new Response(e.message, { status: 401 });
      }
      throw e;
    }

    const db = getServerDb();
    const now = nowMs();
    const scheduledAt = body.scheduled_at ?? now;
    const jobId = `idem_${sha256Hex(body.idempotency_key)}`;
    const ref = db
      .collection("tenants")
      .doc(body.tenant_id)
      .collection("email_jobs")
      .doc(jobId);

    const existing = await ref.get();
    if (existing.exists) {
      const data = existing.data() as EmailJobDoc;
      return Response.json({ job: { id: ref.id, status: data.status } });
    }

    const job: EmailJobDoc = {
      type: body.type,
      template_id: body.type === "template" ? body.template_id ?? null : null,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      raw_html: body.type === "raw_html" ? body.raw_html ?? "" : null,
      raw_text: body.type === "raw_text" ? body.raw_text ?? "" : null,
      variables: body.variables,
      status: "queued",
      scheduled_at: scheduledAt,
      next_attempt_at: scheduledAt,
      idempotency_key: body.idempotency_key,
      retry_count: 0,
      max_retries: body.max_retries,
      locked_at: null,
      locked_by: null,
      ses_message_id: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    };

    await ref.set(job);
    return Response.json({ job: { id: ref.id, status: job.status } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request body", issues: e.issues },
        { status: 400 }
      );
    }
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

