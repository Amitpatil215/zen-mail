import { z } from "zod";
import { getServerDb } from "@/lib/firestore/server";
import { requireWorkerSecret } from "@/lib/worker/requireWorkerSecret";
import { dispatchTenantEmailJobs } from "@/lib/worker/dispatchTenantEmailJobs";

const Body = z.object({
  tenant_limit: z.number().int().min(1).max(500).optional().default(100),
  per_tenant_limit: z.number().int().min(1).max(50).optional().default(10),
});

export async function POST(request: Request) {
  try {
    requireWorkerSecret(request);
    const body = Body.parse(await request.json().catch(() => ({})));

    const db = getServerDb();
    const snaps = await db.collection("tenants").limit(body.tenant_limit).get();

    const perTenant: Array<{
      tenant_id: string;
      claimed: number;
      sent: number;
      queued: number;
      failed: number;
      errors: string[];
    }> = [];

    for (const t of snaps.docs) {
      const tenantId = t.id;
      try {
        const res = await dispatchTenantEmailJobs({
          tenantId,
          limit: body.per_tenant_limit,
        });
        const sent = res.results.filter((r) => r.status === "sent").length;
        const queued = res.results.filter((r) => r.status === "queued").length;
        const failed = res.results.filter((r) => r.status === "failed").length;
        const errors = res.results.map((r) => r.error).filter((e): e is string => Boolean(e));
        perTenant.push({
          tenant_id: tenantId,
          claimed: res.claimed.length,
          sent,
          queued,
          failed,
          errors,
        });
      } catch (e) {
        perTenant.push({
          tenant_id: tenantId,
          claimed: 0,
          sent: 0,
          queued: 0,
          failed: 0,
          errors: [e instanceof Error ? e.message : "Dispatch failed"],
        });
      }
    }

    return Response.json({
      ok: true,
      tenants_processed: perTenant.length,
      totals: {
        claimed: perTenant.reduce((a, x) => a + x.claimed, 0),
        sent: perTenant.reduce((a, x) => a + x.sent, 0),
        queued: perTenant.reduce((a, x) => a + x.queued, 0),
        failed: perTenant.reduce((a, x) => a + x.failed, 0),
      },
      per_tenant: perTenant,
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Bad request", { status: 400 });
  }
}

