export type CampaignRecipient = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  custom?: Record<string, unknown>;
};

export function mergePersonVariables(
  base: Record<string, unknown>,
  person: CampaignRecipient
): Record<string, unknown> {
  return {
    ...base,
    email: person.email,
    first_name: person.first_name ?? "",
    last_name: person.last_name ?? "",
    ...(person.custom && typeof person.custom === "object"
      ? { custom: person.custom }
      : {}),
  };
}
