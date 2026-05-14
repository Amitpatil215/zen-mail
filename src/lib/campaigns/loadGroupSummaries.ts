import { FieldPath, type Firestore } from "firebase-admin/firestore";
import type { GroupDoc } from "@/lib/firestore/schema";

export async function loadGroupSummaries(
  db: Firestore,
  tenantId: string,
  ids: string[]
): Promise<Array<{ id: string; name: string }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const col = db.collection("tenants").doc(tenantId).collection("groups");
  const out: Array<{ id: string; name: string }> = [];

  for (let i = 0; i < unique.length; i += 10) {
    const chunk = unique.slice(i, i + 10);
    const snaps = await col.where(FieldPath.documentId(), "in", chunk).get();
    for (const d of snaps.docs) {
      const data = d.data() as GroupDoc;
      out.push({ id: d.id, name: data.name || d.id });
    }
  }
  return out;
}
