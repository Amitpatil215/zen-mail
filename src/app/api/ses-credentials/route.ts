import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb, nowMs } from "@/lib/firestore/server";
import { encryptString } from "@/lib/crypto/encryption";

export async function GET(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const db = getServerDb();
    const snaps = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("ses_credentials")
      .orderBy("updated_at", "desc")
      .limit(20)
      .get();

    const creds = snaps.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        email_domain: typeof data["email_domain"] === "string" ? data["email_domain"] : "",
        region: typeof data["region"] === "string" ? data["region"] : "",
        status: data["status"] === "live" ? "live" : "draft",
        default_from_email:
          typeof data["default_from_email"] === "string" ? data["default_from_email"] : "",
      };
    });
    return Response.json({ creds });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Unauthorized", {
      status: 401,
    });
  }
}

const Body = z.object({
  status: z.enum(["draft", "live"]).default("draft"),
  email_domain: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(40),
  default_from_name: z.string().trim().min(1).max(120),
  default_from_email: z.string().trim().min(3).max(200),
  ses_access_key: z.string().trim().min(8).max(200),
  ses_secret_key: z.string().trim().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const body = Body.parse(await request.json());
    const now = nowMs();
    const db = getServerDb();
    const ref = db
      .collection("tenants")
      .doc(tenantId)
      .collection("ses_credentials")
      .doc(body.email_domain);

    await ref.set(
      {
        status: body.status,
        email_domain: body.email_domain,
        region: body.region,
        default_from_name: body.default_from_name,
        default_from_email: body.default_from_email,
        ses_access_key_enc: encryptString(body.ses_access_key),
        ses_secret_key_enc: encryptString(body.ses_secret_key),
        created_at: now,
        updated_at: now,
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

