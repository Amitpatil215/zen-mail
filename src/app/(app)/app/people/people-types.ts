export type Group = {
  id: string;
  name: string;
  is_default: boolean;
  created_at: number;
  updated_at: number;
};

export type Person = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  tags?: string[];
  group_ids?: string[];
  unsubscribed_at?: number | null;
};
