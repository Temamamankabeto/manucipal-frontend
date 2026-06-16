export type ApiEnvelope<T> = { success: boolean; message?: string; data: T; meta?: PaginationMeta };
export type PaginationMeta = { current_page: number; per_page: number; total: number; last_page: number };
export type PaginatedResponse<T> = { success?: boolean; message?: string; data: T[]; meta: PaginationMeta };
export type OfficeType = "city" | "subcity" | "woreda" | "zone";
export type OfficeStatusFilter = "active" | "inactive" | "all";
export type OfficeItem = { id: number; name: string; code?: string | null; type: OfficeType; parent_id?: number | null; parent?: OfficeItem | null; children?: OfficeItem[]; is_active?: boolean; can_delete?: boolean; children_count?: number; users_count?: number; citizens_count?: number; created_at?: string; updated_at?: string };
export type OfficeListParams = { search?: string; type?: OfficeType | "all"; status?: OfficeStatusFilter; parent_id?: number | string | null; city_id?: number | string | null; subcity_id?: number | string | null; woreda_id?: number | string | null; all?: boolean; page?: number; per_page?: number };
export type OfficePayload = { name: string; code?: string; type: OfficeType; parent_id?: number | string | null; is_active?: boolean };
