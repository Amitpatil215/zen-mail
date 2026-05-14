import type { Firestore } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";

/** Ensures every id exists under `tenants/{tenantId}/groups`. */
export async function assertGroupIdsForTenant(
  db: Firestore,
  tenantId: string,
  groupIds: string[]
): Promise<void> {
  const unique = [...new Set(groupIds.filter(Boolean))];
  if (!unique.length) return;

  const col = db.collection("tenants").doc(tenantId).collection("groups");
  for (let i = 0; i < unique.length; i += 10) {
    const chunk = unique.slice(i, i + 10);
    const snaps = await col.where(FieldPath.documentId(), "in", chunk).get();
    if (snaps.size !== chunk.length) {
      throw new Error("One or more groups were not found for this tenant.");
    }
  }
}
