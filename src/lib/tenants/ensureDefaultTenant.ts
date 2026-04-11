import { setActiveTenantId } from "@/lib/tenants/activeTenant";

/** Ensures the signed-in user has a tenant and selects the first (or newly created) one. */
export async function ensureTenantAndSelectDefault() {
  const { getClientAuth } = await import("@/lib/firebase/client");
  const token = await getClientAuth().currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in.");

  const res = await fetch("/api/tenants", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { tenants: Array<{ id: string; name: string }> };

  if (data.tenants.length > 0) {
    setActiveTenantId(data.tenants[0]!.id);
    return;
  }

  const created = await fetch("/api/tenants", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: "My Org" }),
  });
  if (!created.ok) throw new Error(await created.text());
  const createdData = (await created.json()) as {
    tenant: { id: string; name: string };
  };
  setActiveTenantId(createdData.tenant.id);
}
