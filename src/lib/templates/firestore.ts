import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { TemplateDoc } from "@/lib/firestore/schema";

export type TemplateRow = TemplateDoc & { id: string };

function templatesCol(tenantId: string) {
  return collection(getClientDb(), "tenants", tenantId, "templates");
}

export async function listTemplatesPage(params: {
  tenantId: string;
  pageSize: number;
  after?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<{
  items: TemplateRow[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  const base = query(templatesCol(params.tenantId), orderBy("updated_at", "desc"), limit(params.pageSize));
  const q = params.after ? query(base, startAfter(params.after)) : base;
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as TemplateDoc) }));
  const lastDoc = snap.docs.length ? snap.docs[snap.docs.length - 1]! : null;
  return { items, lastDoc };
}

export async function getTemplate(params: {
  tenantId: string;
  templateId: string;
}): Promise<TemplateRow | null> {
  const ref = doc(getClientDb(), "tenants", params.tenantId, "templates", params.templateId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as TemplateDoc) };
}

export async function createTemplate(params: {
  tenantId: string;
  doc: Omit<TemplateDoc, "created_at" | "updated_at">;
}): Promise<{ id: string }> {
  const now = Date.now();
  const ref = await addDoc(templatesCol(params.tenantId), {
    ...params.doc,
    created_at: now,
    updated_at: now,
  } satisfies TemplateDoc);
  return { id: ref.id };
}

export async function updateTemplate(params: {
  tenantId: string;
  templateId: string;
  patch: Partial<Omit<TemplateDoc, "created_at" | "updated_at">>;
}) {
  const ref = doc(getClientDb(), "tenants", params.tenantId, "templates", params.templateId);
  await updateDoc(ref, { ...params.patch, updated_at: Date.now() });
}

export async function deleteTemplate(params: { tenantId: string; templateId: string }) {
  const ref = doc(getClientDb(), "tenants", params.tenantId, "templates", params.templateId);
  await deleteDoc(ref);
}

