import { GetSendQuotaCommand } from "@aws-sdk/client-ses";
import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { createSesClient } from "@/lib/ses/client";

const Body = z.object({
  region: z.string().trim().min(1).max(40),
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
    const ses = createSesClient(body);
    const quota = await ses.send(new GetSendQuotaCommand({}));
    return Response.json({ ok: true, quota });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

