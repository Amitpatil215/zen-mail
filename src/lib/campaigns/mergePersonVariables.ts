export type CampaignRecipient = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  custom?: Record<string, unknown>;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export function mergePersonVariables(
  base: Record<string, unknown>,
  person: CampaignRecipient
): Record<string, unknown> {
  const first = person.first_name ?? "";
  const last = person.last_name ?? "";
  return {
    ...base,
    email: person.email,
    first_name: first,
    last_name: last,
    person: {
      ...asRecord(base.person),
      first_name: first,
      last_name: last,
      email: person.email,
    },
    ...(person.custom && typeof person.custom === "object"
      ? { custom: person.custom }
      : {}),
  };
}
