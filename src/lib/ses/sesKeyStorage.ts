import { decryptString, encryptString } from "@/lib/crypto/encryption";

/** Persist SES key material (AES-256-GCM JSON blob). */
export function encryptSesKeyField(plaintext: string): string {
  return encryptString(plaintext);
}

/** Restore key material for use or UI. */
export function decryptSesKeyField(stored: string): string {
  if (!stored) return "";
  return decryptString(stored);
}

export function decryptSesKeyFields<T extends { ses_access_key: string; ses_secret_key: string }>(
  doc: T
): T {
  return {
    ...doc,
    ses_access_key: decryptSesKeyField(doc.ses_access_key),
    ses_secret_key: decryptSesKeyField(doc.ses_secret_key),
  };
}
