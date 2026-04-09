import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { EmailJobDoc, EmailJobType } from "@/lib/firestore/schema";
import { sha256Hex } from "@/lib/crypto/hash";

const Body = z.object({
  type: z.enum(["template", "raw_html", "raw_text"] satisfies [EmailJobType, ...EmailJobType[]]),
  template_id: z.string().trim().min(1).optional(),
  ses_credential_id: z.string().trim().min(1).max(200).optional(),
  from_email: z.string().trim().email().max(200).optional(),
  from_name: z.string().trim().min(1).max(120).optional(),
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
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const body = Body.parse(await request.json());
    const db = getServerDb();
    const now = nowMs();
    const scheduledAt = body.scheduled_at ?? now;

    const jobId = `idem_${sha256Hex(body.idempotency_key)}`;
    const jobRef = db.collection("tenants").doc(tenantId).collection("email_jobs").doc(jobId);
    const existing = await jobRef.get();
    if (existing.exists) {
      const data = existing.data() as EmailJobDoc;
      return Response.json({ job: { id: existing.id, status: data.status } });
    }

    const job: EmailJobDoc = {
      type: body.type,
      template_id: body.type === "template" ? body.template_id ?? null : null,
      ses_credential_id: body.ses_credential_id ?? null,
      from_email: body.from_email ?? null,
      from_name: body.from_name ?? null,
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

    await jobRef.set(job);
    return Response.json({ job: { id: jobRef.id, status: job.status } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

