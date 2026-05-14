import type {
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import type { GroupDoc, TenantDoc } from "@/lib/firestore/schema";
import { nowMs } from "@/lib/firestore/server";

const DEFAULT_GROUP_NAME = "Default";

export async function getOrCreateDefaultGroupId(
  db: Firestore,
  tenantId: string
): Promise<string> {
  const groups = db.collection("tenants").doc(tenantId).collection("groups");
  const existing = await groups.where("is_default", "==", true).limit(1).get();
  if (!existing.empty) return existing.docs[0]!.id;

  const now = nowMs();
  const ref = groups.doc();
  const doc: GroupDoc = {
    name: DEFAULT_GROUP_NAME,
    is_default: true,
    created_at: now,
    updated_at: now,
  };
  await ref.set(doc);
  return ref.id;
}

/** Backfill missing `group_ids` on people (bounded batches) until tenant flag is set. */
export async function migratePeopleGroupIdsIfNeeded(
  db: Firestore,
  tenantId: string,
  defaultGroupId: string
): Promise<void> {
  const tenantRef = db.collection("tenants").doc(tenantId);
  const tenantSnap = await tenantRef.get();
  if (!tenantSnap.exists) return;
  const t = tenantSnap.data() as TenantDoc;
  if (t.people_group_ids_migrated) return;

  const peopleRef = tenantRef.collection("people");
  let last: QueryDocumentSnapshot | null = null;

  for (;;) {
    let q = peopleRef.orderBy(FieldPath.documentId()).limit(200);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let n = 0;
    for (const doc of snap.docs) {
      const g = doc.get("group_ids") as string[] | undefined;
      if (!g?.length) {
        batch.update(doc.ref, {
          group_ids: [defaultGroupId],
          updated_at: nowMs(),
        });
        n++;
      }
    }
    if (n) await batch.commit();

    last = snap.docs[snap.docs.length - 1]!;
    if (snap.size < 200) break;
  }

  await tenantRef.set(
    { people_group_ids_migrated: true, updated_at: nowMs() },
    { merge: true }
  );
}
