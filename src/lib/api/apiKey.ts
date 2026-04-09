import { sha256Hex } from "@/lib/crypto/hash";
import { getServerDb } from "@/lib/firestore/server";

export async function verifyTenantApiKey(tenantId: string, rawKey: string) {
  const keyHash = sha256Hex(rawKey);
  const db = getServerDb();
  const snaps = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("api_keys")
    .where("key_hash", "==", keyHash)
    .where("revoked_at", "==", null)
    .limit(1)
    .get();
  const doc = snaps.docs[0];
  if (!doc) throw new Error("Invalid API key.");
  await doc.ref.set({ last_used_at: Date.now() }, { merge: true });
  return { keyId: doc.id };
}

