import { z } from "zod";
import { requireWorkerSecret } from "@/lib/worker/requireWorkerSecret";
import { dispatchTenantEmailJobs } from "@/lib/worker/dispatchTenantEmailJobs";

const Body = z.object({
  tenant_id: z.string().trim().min(1),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export async function POST(request: Request) {
  try {
    requireWorkerSecret(request);
    const body = Body.parse(await request.json());
    const { claimed, results } = await dispatchTenantEmailJobs({
      tenantId: body.tenant_id,
      limit: body.limit,
    });
    return Response.json({ claimed, results });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", {
      status: 400,
    });
  }
}

