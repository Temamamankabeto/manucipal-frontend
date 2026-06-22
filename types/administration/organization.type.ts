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

export type Office = {
  id: number;
  name: string;
  code?: string | null;
  users_count?: number;
  departments_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type Department = {
  id: number;
  office_id: number;
  name: string;
  office?: Pick<Office, "id" | "name"> | null;
  created_at?: string;
  updated_at?: string;
};

export type OfficePayload = {
  name: string;
};

export type DepartmentPayload = {
  office_id: number | string;
  name: string;
};

export type OrganizationParams = {
  search?: string;
  office_id?: number | string;
  per_page?: number;
  page?: number;
  all?: boolean;
};
