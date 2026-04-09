import { GetSendQuotaCommand } from "@aws-sdk/client-ses";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { getServerDb } from "@/lib/firestore/server";
import { createSesClient, type SesCredsDoc } from "@/lib/ses/client";

export async function POST(request: Request) {
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
      .where("status", "==", "live")
      .limit(1)
      .get();
    const doc = snaps.docs[0];
    if (!doc) return new Response("No live SES credentials to test.", { status: 400 });
    const creds = doc.data() as SesCredsDoc;

    const ses = createSesClient(creds);
    const quota = await ses.send(new GetSendQuotaCommand({}));
    return Response.json({ ok: true, quota });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

