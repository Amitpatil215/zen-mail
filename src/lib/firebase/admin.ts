import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type AdminFirebase = {
  app: App;
  auth: Auth;
  db: Firestore;
};

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function normalizePrivateKey(key: string) {
  // Vercel env often stores newlines escaped.
  return key.replace(/\\n/g, "\n");
}

function getAdminConfig() {
  return {
    projectId: required("FIREBASE_PROJECT_ID", process.env.FIREBASE_PROJECT_ID),
    clientEmail: required(
      "FIREBASE_CLIENT_EMAIL",
      process.env.FIREBASE_CLIENT_EMAIL
    ),
    privateKey: normalizePrivateKey(
      required("FIREBASE_PRIVATE_KEY", process.env.FIREBASE_PRIVATE_KEY)
    ),
  };
}

export function getAdminFirebase(): AdminFirebase {
  const existing = getApps()[0];
  const app =
    existing ??
    initializeApp({
      credential: cert(getAdminConfig()),
    });

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

export function getAdminAuth() {
  return getAdminFirebase().auth;
}

export function getAdminDb() {
  return getAdminFirebase().db;
}

