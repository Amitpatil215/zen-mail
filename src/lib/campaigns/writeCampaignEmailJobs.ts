import type { Firestore } from "firebase-admin/firestore";
import type { EmailJobDoc } from "@/lib/firestore/schema";
import { sha256Hex } from "@/lib/crypto/hash";
import { nowMs } from "@/lib/firestore/server";
import type { CampaignRecipient } from "./mergePersonVariables";
import { mergePersonVariables } from "./mergePersonVariables";

const BATCH = 400;

export async function writeCampaignEmailJobs(params: {
  db: Firestore;
  tenantId: string;
  campaignId: string;
  scheduledAt: number;
  templateId: string;
  sesCredentialId: string;
  fromEmail: string | null;
  fromName: string | null;
  cc: string[];
  bcc: string[];
  subject: string;
  baseVariables: Record<string, unknown>;
  maxRetries: number;
  recipients: CampaignRecipient[];
}): Promise<{ created: number }> {
  const now = nowMs();
  let created = 0;

  for (let i = 0; i < params.recipients.length; i += BATCH) {
    const fbBatch = params.db.batch();
    const slice = params.recipients.slice(i, i + BATCH);

    for (const r of slice) {
      const idempotency_key = `campaign:${params.campaignId}:person:${r.id}`;
      const jobId = `idem_${sha256Hex(idempotency_key)}`;
      const variables = mergePersonVariables(params.baseVariables, r);
      const job: EmailJobDoc = {
        type: "template",
        template_id: params.templateId,
        ses_credential_id: params.sesCredentialId,
        from_email: params.fromEmail,
        from_name: params.fromName,
        to: [r.email],
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        raw_html: null,
        raw_text: null,
        variables,
        status: "queued",
        scheduled_at: params.scheduledAt,
        next_attempt_at: params.scheduledAt,
        idempotency_key,
        retry_count: 0,
        max_retries: params.maxRetries,
        locked_at: null,
        locked_by: null,
        ses_message_id: null,
        last_error: null,
        created_at: now,
        updated_at: now,
      };
      const ref = params.db
        .collection("tenants")
        .doc(params.tenantId)
        .collection("email_jobs")
        .doc(jobId);
      fbBatch.set(ref, job);
      created++;
    }
    await fbBatch.commit();
  }

  return { created };
}
