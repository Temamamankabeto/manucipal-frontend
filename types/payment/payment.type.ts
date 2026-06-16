export type ApiMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta | null;
};

export type Paginated<T> = {
  success: boolean;
  message?: string;
  data: T[];
  meta: ApiMeta;
};

export type PaymentStatus =
  | "draft"
  | "manager_review"
  | "budget_tl_review"
  | "budget_expert_processing"
  | "budget_tl_final_review"
  | "manager_final_review"
  | "records_processing"
  | "sent_to_finance"
  | "payment_completed"
  | "rejected";

export type PaymentItem = {
  id?: number;
  description: string;
  invoice_no?: string | null;
  budget_code?: string | null;
  budget?: { id: number; bi_code?: string | null; budget_code: string; account_name: string; allocated_amount: number | string; used_amount: number | string; remaining_amount: number | string; status: string } | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price?: number | null;
  amount?: number | null;
  remark?: string | null;
};

export type PaymentAttachment = {
  id: number;
  original_name: string;
  stored_path: string;
  document_type: string;
  mime_type?: string | null;
  size_bytes: number;
};

export type PaymentHistory = {
  id: number;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  note?: string | null;
  created_at: string;
  actor?: PaymentSigner | null;
};

export type PaymentSigner = {
  id: number;
  name: string;
  roles?: Array<{ id?: number; name: string }>;
  signature_url?: string | null;
  stamp_url?: string | null;
  titer_url?: string | null;
  signature_path?: string | null;
  stamp_path?: string | null;
  titer_path?: string | null;
};


export type PaymentPerDiemEmployee = {
  id?: number;
  employee_name: string;
  salary_level?: string | null;
  salary_amount?: number | string | null;
  transportation_type?: string | null;
  departure_location?: string | null;
  destination?: string | null;
  departure_date?: string | null;
  departure_time?: string | null;
  return_date?: string | null;
  return_time?: string | null;
  number_of_days?: number | string | null;
  breakfast_deduction?: number | string | null;
  lunch_deduction?: number | string | null;
  dinner_deduction?: number | string | null;
  accommodation_deduction?: number | string | null;
  transport_cost?: number | string | null;
  fuel_cost?: number | string | null;
  other_cost?: number | string | null;
  daily_rate?: number | string | null;
  calculated_per_diem?: number | string | null;
  total_payable?: number | string | null;
  work_description?: string | null;
  is_selected?: boolean;
};

export type PaymentPerDiem = {
  id?: number;
  program?: string | null;
  purpose?: string | null;
  pi_code?: string | null;
  budget_code?: string | null;
  budget?: { id: number; bi_code?: string | null; budget_code: string; account_name: string; allocated_amount: number | string; used_amount: number | string; remaining_amount: number | string; status: string } | null;
  office_name?: string | null;
  departure_location?: string | null;
  destination?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  transport_allowance?: number | string | null;
  daily_per_diem_rate?: number | string | null;
  approved_budget?: number | string | null;
  total_per_diem?: number | string | null;
  total_transport?: number | string | null;
  total_fuel?: number | string | null;
  total_other?: number | string | null;
  grand_total?: number | string | null;
  employees?: PaymentPerDiemEmployee[];
};

export type PaymentRelation = {
  id: number;
  name: string;
  category_id?: number;
};

export type PaymentRequest = {
  id: number;
  payment_no: string;
  requester_type: string;
  requesting_entity?: string | null;
  request_type?: string | null;
  payment_category_id?: number | null;
  payment_type_id?: number | null;
  budget_id?: number | null;
  payment_category?: string | PaymentRelation | null;
  payment_type?: PaymentRelation | null;
  title: string;
  description?: string | null;
  amount: number | string;
  budget_code?: string | null;
  budget?: { id: number; bi_code?: string | null; budget_code: string; account_name: string; allocated_amount: number | string; used_amount: number | string; remaining_amount: number | string; status: string } | null;
  office_code?: string | null;
  budget_year?: string | null;
  funding_source?: string | null;
  reference_no?: string | null;
  document_no?: string | null;
  official_date?: string | null;
  status: PaymentStatus;
  current_handler_id?: number | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  paid_amount?: number | string | null;
  paid_date?: string | null;
  paid_by?: number | null;
  voucher_no?: string | null;
  finance_remark?: string | null;
  requester?: { id: number; name: string; email?: string } | null;
  current_handler?: PaymentSigner | null;
  manager_signer?: PaymentSigner | null;
  budget_tl_signer?: PaymentSigner | null;
  budget_expert_signer?: PaymentSigner | null;
  budget_tl_final_signer?: PaymentSigner | null;
  manager_final_signer?: PaymentSigner | null;
  records_signer?: PaymentSigner | null;
  finance_signer?: PaymentSigner | null;
  items?: PaymentItem[];
  attachments?: PaymentAttachment[];
  histories?: PaymentHistory[];
  per_diem?: PaymentPerDiem | null;
  created_at: string;
};

export type PaymentListParams = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
};

export type PaymentPayload = {
  requester_type: string;
  requesting_entity?: string | null;
  current_handler_id?: number | string | null;
  expert_user_id?: number | string | null;
  request_type?: string;
  payment_category_id?: number | string | null;
  payment_type_id?: number | string | null;
  budget_id?: number | string | null;
  payment_category?: string;
  title?: string;
  description?: string;
  amount?: number;
  items?: PaymentItem[];
  attachments?: File[];
};

export type PaymentActionPayload = {
  action: string;
  note?: string;
  reason?: string;
  send_to_user_id?: number | string | null;
  current_handler_id?: number | string | null;
  expert_user_id?: number | string | null;
  budget_id?: number | string | null;
  budget_code?: string;
  office_code?: string;
  budget_year?: string;
  reference_no?: string;
  official_date?: string;
  paid_amount?: number | string;
  paid_date?: string;
  voucher_no?: string;
  finance_remark?: string;
  items?: PaymentItem[];
  per_diem?: { common?: Record<string, unknown>; employees?: Array<Record<string, unknown>> };
};
