export type ApiMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type Paginated<T> = {
  success: boolean;
  message?: string;
  data: T[];
  meta: ApiMeta;
};

export type PaymentCategory = {
  id: number;
  name: string;
  types_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type PaymentType = {
  id: number;
  category_id: number;
  name: string;
  category?: PaymentCategory | null;
  created_at?: string;
  updated_at?: string;
};

export type PaymentCategoryPayload = {
  name: string;
};

export type PaymentTypePayload = {
  category_id: number | string;
  name: string;
};

export type PaymentMasterDataParams = {
  search?: string;
  category_id?: number | string;
  per_page?: number;
  page?: number;
};
