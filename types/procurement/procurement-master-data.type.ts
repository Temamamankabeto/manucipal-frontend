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

export type ProcurementCategory = {
  id: number;
  name: string;
  types_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProcurementType = {
  id: number;
  category_id: number;
  name: string;
  category?: ProcurementCategory | null;
  created_at?: string;
  updated_at?: string;
};

export type ProcurementCategoryPayload = {
  name: string;
};

export type ProcurementTypePayload = {
  category_id: number | string;
  name: string;
};

export type ProcurementMasterDataParams = {
  search?: string;
  category_id?: number | string;
  per_page?: number;
  page?: number;
};
