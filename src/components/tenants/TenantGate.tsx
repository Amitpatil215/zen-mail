"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";

export function TenantGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  usePathname();
  const tenantId = getActiveTenantId();

  useEffect(() => {
    if (!tenantId) router.replace("/app/settings/tenants");
  }, [router, tenantId]);

  if (!tenantId) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}

