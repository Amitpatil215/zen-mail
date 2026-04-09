import { getAdminAuth } from "@/lib/firebase/admin";

export type AuthedUser = { uid: string; email?: string | null };

export async function requireIdToken(request: Request): Promise<AuthedUser> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) throw new Error("Missing Authorization Bearer token.");

  const idToken = match[1]!;
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return { uid: decoded.uid, email: decoded.email ?? null };
}

