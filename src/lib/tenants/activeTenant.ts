export const ACTIVE_TENANT_STORAGE_KEY = "zenmail.activeTenantId";

export function getActiveTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
}

export function setActiveTenantId(tenantId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
}

export function clearActiveTenantId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
}

