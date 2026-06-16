export type PaginationMeta = { current_page: number; per_page: number; total: number; last_page: number };
export type PaginatedResponse<T> = { success?: boolean; message?: string; data: T[]; meta: PaginationMeta };
export type AuditLogFilters = { actor?: string; action?: string; module?: string; page?: number; per_page?: number };
export type AuditLogItem = { id: number; actor_id?: number | null; module?: string | null; entity_type?: string | null; action: string; description?: string | null; created_at?: string };
