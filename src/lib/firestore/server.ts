import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export function getServerDb() {
  return getAdminDb();
}

export function nowMs() {
  return Date.now();
}

export const serverTimestamp = FieldValue.serverTimestamp;

