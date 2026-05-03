/** Row shape for the hsn_master table (align with your Supabase schema). */
export type HSNMasterRow = {
  hsn_code: string;
  description: string;
  gst_rate: number | null;
  condition_type: string | null;
  notes: string | null;
  keywords: string | null;
  level: string | null;
  category: string | null;
  [key: string]: unknown;
};

export type HSNRecord = {
  id: string;
  code: string;
  description: string;
  chapter?: string;
  section?: string;
  gst_rate?: number;
  created_at?: string;
};
