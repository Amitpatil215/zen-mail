import type { Person } from "./people-types";

export function personSubscriptionSummary(p: Person): string {
  if (p.unsubscribed_at) return "All mail off";
  const n = Object.keys(p.unsubscribed_from ?? {}).length;
  if (n > 0) return `${n} sender${n === 1 ? "" : "s"}`;
  return "Active";
}

export function personSubscriptionDetail(p: Person): string {
  if (p.unsubscribed_at) {
    return "Unsubscribed from all workspace email (legacy / global).";
  }
  const keys = Object.keys(p.unsubscribed_from ?? {}).sort();
  if (!keys.length) return "Receiving campaigns from all From addresses.";
  return `Not receiving from: ${keys.join(", ")}`;
}
