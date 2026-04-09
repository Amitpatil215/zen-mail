import { z } from "zod";
import { requireIdToken } from "@/lib/api/auth";
import { requireTenantMembership } from "@/lib/api/tenant";
import { renderLiquid } from "@/lib/templates/liquid";

const Body = z.object({
  html: z.string().min(1).max(200_000),
  data: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireIdToken(request);
    const tenantId = request.headers.get("x-tenant-id")?.trim();
    if (!tenantId) return new Response("Missing x-tenant-id", { status: 400 });
    await requireTenantMembership(tenantId, user.uid);

    const parsed = Body.parse(await request.json());
    const rendered = await renderLiquid(parsed.html, parsed.data ?? {});
    return Response.json({ html: rendered });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

