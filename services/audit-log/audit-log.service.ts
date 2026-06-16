import api from "@/lib/api";
import type { AuditLogFilters, AuditLogItem, PaginatedResponse } from "@/types/audit-log-management/audit-log.type";
function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) { const out: Record<string, unknown> = {}; Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== "" && v !== "all") out[k] = v; }); return out; }
function paginated<T>(body: any): PaginatedResponse<T> { const data = Array.isArray(body?.data) ? body.data : []; const meta = body?.meta ?? {}; return { data, meta: { current_page: Number(meta.current_page ?? 1), per_page: Number(meta.per_page ?? data.length ?? 10), total: Number(meta.total ?? data.length ?? 0), last_page: Number(meta.last_page ?? 1) } }; }
export const auditLogService = { async list(params: AuditLogFilters = {}) { const r = await api.get("/admin/audit-logs", { params: cleanParams(params) }); return paginated<AuditLogItem>(r.data); } };
export default auditLogService;
