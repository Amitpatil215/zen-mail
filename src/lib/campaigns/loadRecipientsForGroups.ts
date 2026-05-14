import { FieldPath, type Firestore } from "firebase-admin/firestore";
import type { PersonDoc } from "@/lib/firestore/schema";
import { MAX_CAMPAIGN_RECIPIENTS } from "./campaignPayload";
import type { CampaignRecipient } from "./mergePersonVariables";

const PAGE = 500;

export async function loadRecipientsForGroups(params: {
  db: Firestore;
  tenantId: string;
  groupIds: string[];
}): Promise<CampaignRecipient[]> {
  const uniqueGroups = [...new Set(params.groupIds.filter(Boolean))];
  if (!uniqueGroups.length) return [];

  const base = params.db.collection("tenants").doc(params.tenantId).collection("people");
  const byEmail = new Map<string, CampaignRecipient>();

  let cursor: { created_at: number; id: string } | null = null;
  for (;;) {
    let q = base
      .where("group_ids", "array-contains-any", uniqueGroups)
      .orderBy("created_at", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(PAGE);
    if (cursor) {
      q = q.startAfter(cursor.created_at, cursor.id);
    }
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const d = doc.data() as PersonDoc;
      if (d.unsubscribed_at) continue;
      const email = (d.email || "").toLowerCase().trim();
      if (!email) continue;
      if (byEmail.has(email)) continue;
      byEmail.set(email, {
        id: doc.id,
        email,
        first_name: d.first_name,
        last_name: d.last_name,
        custom: d.custom,
      });
      if (byEmail.size > MAX_CAMPAIGN_RECIPIENTS) {
        return [...byEmail.values()];
      }
    }

    const last = snap.docs[snap.docs.length - 1]!;
    cursor = { created_at: last.get("created_at") as number, id: last.id };
    if (snap.size < PAGE) break;
  }

  return [...byEmail.values()];
}
