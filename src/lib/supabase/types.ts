/** Row shape for the hsn_master table (align with your Supabase schema). */
export type HSNMasterRow = {
  HSN_CD: string;
  HSN_Description: string;
  "GST Rate": number | null;
  gst_math_rate: number | null;
  is_conditional: boolean | null;
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
