"use client";

import { getActiveTenantId } from "@/lib/tenants/activeTenant";

export async function authedFetch(path: string, init?: RequestInit) {
  const tenantId = getActiveTenantId();
  if (!tenantId) throw new Error("No active tenant selected.");
  const { getClientAuth } = await import("@/lib/firebase/client");
  const token = await getClientAuth().currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in.");
  return fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-tenant-id": tenantId,
      ...(init?.headers ?? {}),
    },
  });
}

