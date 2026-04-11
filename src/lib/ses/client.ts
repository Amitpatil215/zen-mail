import { SESClient } from "@aws-sdk/client-ses";

export type SesCreds = {
  region: string;
  ses_access_key: string;
  ses_secret_key: string;
};

export type SesCredsDoc = {
  status: "draft" | "live";
  region: string;
  email_domain: string;
  default_from_name: string;
  default_from_email: string;
  default_reply_to_email?: string | null;
  default_cc_email?: string | null;
  default_bcc_email?: string | null;
  /** Encrypted at rest in Firestore (see sesKeyStorage). */
  ses_access_key: string;
  ses_secret_key: string;
};

export function createSesClient(creds: SesCreds) {
  const accessKeyId = creds.ses_access_key?.trim();
  const secretAccessKey = creds.ses_secret_key?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing SES credentials (access key / secret key).");
  }
  return new SESClient({
    region: creds.region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

