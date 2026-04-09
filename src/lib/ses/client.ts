import { SESClient } from "@aws-sdk/client-ses";
import { decryptString } from "@/lib/crypto/encryption";

export type SesCredsDoc = {
  status: "draft" | "live";
  region: string;
  email_domain: string;
  default_from_name: string;
  default_from_email: string;
  default_reply_to_email?: string | null;
  default_cc_email?: string | null;
  default_bcc_email?: string | null;
  ses_access_key_enc: string;
  ses_secret_key_enc: string;
};

export function createSesClient(creds: SesCredsDoc) {
  const accessKeyId = decryptString(creds.ses_access_key_enc);
  const secretAccessKey = decryptString(creds.ses_secret_key_enc);
  return new SESClient({
    region: creds.region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

