import { z } from "zod";

/** Firestore `array-contains-any` allows at most 10 values; keep server and UI aligned. */
export const MAX_CAMPAIGN_GROUPS = 10;
export const MAX_CAMPAIGN_RECIPIENTS = 2500;

export const CampaignPayload = z.object({
  name: z.string().trim().min(1).max(120),
  template_id: z.string().trim().min(1),
  group_ids: z.array(z.string().trim().min(1)).min(1).max(MAX_CAMPAIGN_GROUPS),
  scheduled_at: z.number().int(),
  ses_credential_id: z.string().trim().min(1).max(200),
  from_email: z.string().trim().email().max(200).optional(),
  from_name: z.string().trim().min(1).max(120).optional(),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().trim().min(1).max(200),
  variables: z.record(z.string(), z.unknown()).optional().default({}),
  max_retries: z.number().int().min(0).max(10).optional().default(3),
});

export type CampaignPayloadIn = z.infer<typeof CampaignPayload>;

export const CampaignPatch = CampaignPayload.partial().refine(
  (o) => Object.keys(o).length > 0,
  { message: "Provide at least one field to update." }
);
