/** Mutates plain JSON body before zod parse: drop empty sender fields. */
export function normalizeCampaignRaw(raw: unknown) {
  if (!raw || typeof raw !== "object") return;
  const o = raw as Record<string, unknown>;
  if (typeof o.from_email === "string" && !o.from_email.trim()) delete o.from_email;
  if (typeof o.from_name === "string" && !o.from_name.trim()) delete o.from_name;
}
