import { SendEmailCommand } from "@aws-sdk/client-ses";
import { getServerDb } from "@/lib/firestore/server";
import type { EmailJobDoc } from "@/lib/firestore/schema";
import { renderStoredTemplate } from "@/lib/templates/renderStoredTemplate";
import { createSesClient, type SesCredsDoc } from "@/lib/ses/client";
import { decryptSesKeyFields } from "@/lib/ses/sesKeyStorage";
import { signParams } from "@/lib/crypto/signing";

async function getSesCreds(params: {
  tenantId: string;
  sesCredentialId?: string | null;
}): Promise<SesCredsDoc> {
  const db = getServerDb();
  if (params.sesCredentialId) {
    const snap = await db
      .collection("tenants")
      .doc(params.tenantId)
      .collection("ses_credentials")
      .doc(params.sesCredentialId)
      .get();
    if (!snap.exists) throw new Error("Selected SES credentials not found.");
    return decryptSesKeyFields(snap.data() as SesCredsDoc);
  }

  const snaps = await db
    .collection("tenants")
    .doc(params.tenantId)
    .collection("ses_credentials")
    .orderBy("updated_at", "desc")
    .limit(1)
    .get();
  const doc = snaps.docs[0];
  if (!doc) throw new Error("No SES credentials configured.");
  return decryptSesKeyFields(doc.data() as SesCredsDoc);
}

export async function sendEmailJob(params: {
  tenantId: string;
  jobId: string;
  job: EmailJobDoc;
}) {
  const creds = await getSesCreds({
    tenantId: params.tenantId,
    sesCredentialId: params.job.ses_credential_id ?? null,
  });
  const ses = createSesClient(creds);

  const from = params.job.from_email ?? creds.default_from_email;
  if (!from) throw new Error("default_from_email not configured.");

  let subject = params.job.subject;
  let htmlBody: string | null = params.job.raw_html ?? null;
  let textBody: string | null = params.job.raw_text ?? null;

  if (params.job.type === "template") {
    const templateId = params.job.template_id;
    if (!templateId) throw new Error("Missing template_id.");
    const rendered = await renderStoredTemplate(params.tenantId, templateId, params.job.variables);
    subject = rendered.subject;
    htmlBody = rendered.html;
    textBody = rendered.text;
  }

  if (!htmlBody && !textBody) throw new Error("Email must have html or text.");

  const baseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  if (params.job.track_email_open === true && baseUrl && htmlBody) {
    const sig = signParams({ t: params.tenantId, j: params.jobId });
    const pixel = `${baseUrl}/t/open?t=${encodeURIComponent(params.tenantId)}&j=${encodeURIComponent(params.jobId)}&sig=${sig}`;
    htmlBody = `${htmlBody}\n<img src="${pixel}" width="1" height="1" style="display:none" alt="" />`;
  }

  const cmd = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: params.job.to,
      CcAddresses: params.job.cc,
      BccAddresses: params.job.bcc,
    },
    ReplyToAddresses: creds.default_reply_to_email ? [creds.default_reply_to_email] : undefined,
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: htmlBody ? { Data: htmlBody, Charset: "UTF-8" } : undefined,
        Text: textBody ? { Data: textBody, Charset: "UTF-8" } : undefined,
      },
    },
  });

  const res = await ses.send(cmd);
  return { messageId: res.MessageId ?? null };
}

