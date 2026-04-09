import { getServerDb, nowMs } from "@/lib/firestore/server";
import type { EmailJobDoc } from "@/lib/firestore/schema";
import { sendEmailJob } from "@/lib/ses/sendJob";

function computeNextAttemptMs(now: number, retryCount: number) {
  const base = 1_000; // 1s
  const cap = 60_000; // 60s
  const exp = Math.min(cap, base * 2 ** Math.min(10, retryCount));
  const jitter = Math.floor(Math.random() * 400);
  return now + exp + jitter;
}

export async function dispatchTenantEmailJobs(params: {
  tenantId: string;
  limit?: number;
}): Promise<{
  claimed: Array<{ id: string }>;
  results: Array<{ id: string; status: string; ses_message_id?: string | null; error?: string }>;
}> {
  const db = getServerDb();
  const now = nowMs();
  const limit = Math.min(50, Math.max(1, params.limit ?? 10));

  const jobsRef = db.collection("tenants").doc(params.tenantId).collection("email_jobs");
  const snaps = await jobsRef
    .where("status", "==", "queued")
    .where("next_attempt_at", "<=", now)
    .orderBy("next_attempt_at", "asc")
    .limit(limit)
    .get();

  const claimed: Array<{ id: string }> = [];
  const results: Array<{ id: string; status: string; ses_message_id?: string | null; error?: string }> = [];

  for (const doc of snaps.docs) {
    const jobId = doc.id;
    const lockId = `worker_${now}_${Math.random().toString(16).slice(2)}`;

    const claimedJob = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(doc.ref);
      if (!fresh.exists) return null;
      const data = fresh.data() as EmailJobDoc;
      const lockedAt = data.locked_at ?? 0;
      const lockExpired = data.status !== "processing" || now - lockedAt > 60_000;
      if (data.status !== "queued" && !lockExpired) return null;
      if (data.status !== "queued") return null;

      tx.update(doc.ref, {
        status: "processing",
        locked_at: now,
        locked_by: lockId,
        updated_at: now,
      });
      return data;
    });

    if (!claimedJob) continue;
    claimed.push({ id: jobId });

    try {
      const res = await sendEmailJob({
        tenantId: params.tenantId,
        jobId,
        job: claimedJob,
      });
      await doc.ref.update({
        status: "sent",
        ses_message_id: res.messageId,
        locked_at: null,
        locked_by: null,
        last_error: null,
        updated_at: nowMs(),
      });
      results.push({
        id: jobId,
        status: "sent",
        ses_message_id: res.messageId,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      const fresh = (await doc.ref.get()).data() as EmailJobDoc | undefined;
      const retryCount = (fresh?.retry_count ?? claimedJob.retry_count) + 1;
      const maxRetries = fresh?.max_retries ?? claimedJob.max_retries;
      const shouldRetry = retryCount <= maxRetries;

      await doc.ref.update({
        status: shouldRetry ? "queued" : "failed",
        retry_count: retryCount,
        next_attempt_at: shouldRetry ? computeNextAttemptMs(now, retryCount) : now,
        last_error: msg,
        locked_at: null,
        locked_by: null,
        updated_at: nowMs(),
      });

      results.push({ id: jobId, status: shouldRetry ? "queued" : "failed", error: msg });
    }
  }

  return { claimed, results };
}

