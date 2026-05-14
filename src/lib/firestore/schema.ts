export type UserRole = "owner" | "admin" | "member";

export type TenantDoc = {
  name: string;
  created_at: number;
  updated_at: number;
  /** Set after one-time backfill of `group_ids` on legacy people docs. */
  people_group_ids_migrated?: boolean;
};

export type GroupDoc = {
  name: string;
  is_default: boolean;
  created_at: number;
  updated_at: number;
};

export type UserTenantDoc = {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  created_at: number;
  updated_at: number;
};

export type PersonDoc = {
  email: string;
  first_name?: string;
  last_name?: string;
  tags: string[];
  /** Person may belong to multiple groups within the tenant. */
  group_ids: string[];
  custom: Record<string, unknown>;
  unsubscribed_at?: number | null;
  created_at: number;
  updated_at: number;
};

export type TemplateDoc = {
  name: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  labels: string[];
  sample_data: Record<string, unknown>;
  created_at: number;
  updated_at: number;
};

export type EmailJobStatus = "queued" | "processing" | "sent" | "failed";
export type EmailJobType = "template" | "raw_html" | "raw_text";

export type EmailJobDoc = {
  type: EmailJobType;
  /** Set when the job was created from a campaign launch. */
  campaign_id?: string | null;
  template_id?: string | null;
  ses_credential_id?: string | null;
  from_email?: string | null;
  from_name?: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  raw_html?: string | null;
  raw_text?: string | null;
  variables: Record<string, unknown>;
  status: EmailJobStatus;
  scheduled_at: number;
  next_attempt_at: number;
  idempotency_key: string;
  retry_count: number;
  max_retries: number;
  locked_at?: number | null;
  locked_by?: string | null;
  ses_message_id?: string | null;
  last_error?: string | null;
  /** When true, a signed tracking pixel may be appended to HTML at send time (requires PUBLIC_BASE_URL). */
  track_email_open?: boolean;
  /** First successful open pixel load (set once). */
  email_opened?: boolean;
  email_opened_at?: number | null;
  created_at: number;
  updated_at: number;
};

export type ApiKeyDoc = {
  name: string;
  key_hash: string;
  created_at: number;
  updated_at: number;
  last_used_at?: number | null;
  revoked_at?: number | null;
};

export type AssetDoc = {
  url: string;
  file_name: string;
  folder: string;
  content_type: string;
  size: number;
  created_at: number;
};

export type EmailEventType =
  | "delivered"
  | "bounced"
  | "complaint"
  | "opened"
  | "clicked"
  | "unsubscribed";

export type EmailEventDoc = {
  job_id?: string | null;
  ses_message_id?: string | null;
  type: EmailEventType;
  provider: "ses";
  payload: Record<string, unknown>;
  created_at: number;
};

export type CampaignStatus = "draft" | "launched";

export type CampaignDoc = {
  name: string;
  status: CampaignStatus;
  template_id: string;
  group_ids: string[];
  /** When queued email jobs should first run (epoch ms). */
  scheduled_at: number;
  ses_credential_id: string | null;
  from_email: string | null;
  from_name: string | null;
  cc: string[];
  bcc: string[];
  subject: string;
  variables: Record<string, unknown>;
  max_retries: number;
  /** Copied onto each job when the campaign is launched. Omitted on legacy drafts = off. */
  track_email_open?: boolean;
  /** Filled when status becomes launched. */
  recipient_count: number | null;
  launched_at: number | null;
  created_at: number;
  updated_at: number;
};

