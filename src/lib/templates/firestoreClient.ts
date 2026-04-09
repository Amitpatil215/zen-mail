import { getClientDb } from "@/lib/firebase/client";
import type { TemplateDoc } from "@/lib/firestore/schema";

export type TemplateRow = TemplateDoc & { id: string };

export function tenantTemplatesCollection(tenantId: string) {
  return `tenants/${tenantId}/templates`;
}

export async function subscribeTemplates(params: {
  tenantId: string;
  onChange: (rows: TemplateRow[]) => void;
  onError: (message: string) => void;
}) {
  const db = getClientDb();
  const { collection, onSnapshot, orderBy, query } = await import("firebase/firestore");
  const q = query(collection(db, tenantTemplatesCollection(params.tenantId)), orderBy("updated_at", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as TemplateDoc) }));
      params.onChange(rows);
    },
    (err) => params.onError(err?.message ?? "Failed to subscribe to templates.")
  );
}

export async function createTemplate(params: {
  tenantId: string;
  doc: Omit<TemplateDoc, "created_at" | "updated_at">;
}) {
  const db = getClientDb();
  const { addDoc, collection } = await import("firebase/firestore");
  const now = Date.now();
  const ref = await addDoc(collection(db, tenantTemplatesCollection(params.tenantId)), {
    ...params.doc,
    created_at: now,
    updated_at: now,
  } satisfies TemplateDoc);
  return ref.id;
}

export async function updateTemplate(params: {
  tenantId: string;
  templateId: string;
  patch: Partial<Omit<TemplateDoc, "created_at" | "updated_at">>;
}) {
  const db = getClientDb();
  const { doc, updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(db, tenantTemplatesCollection(params.tenantId), params.templateId), {
    ...params.patch,
    updated_at: Date.now(),
  });
}

export async function deleteTemplate(params: { tenantId: string; templateId: string }) {
  const db = getClientDb();
  const { deleteDoc, doc } = await import("firebase/firestore");
  await deleteDoc(doc(db, tenantTemplatesCollection(params.tenantId), params.templateId));
}

