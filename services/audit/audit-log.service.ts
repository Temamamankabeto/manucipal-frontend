import api from "@/lib/api";
import type { AuditLog, AuditLogResponse } from "@/types/audit/audit-log.type";

export const auditLogService = {
  async list(params: { entity_type?: string; action?: string; per_page?: number } = {}) {
    const r = await api.get("/admin/audit-logs", { params });
    const body = r.data?.data;
    const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    return { data: rows as AuditLog[], current_page: Number(body?.current_page ?? 1), per_page: Number(body?.per_page ?? rows.length), total: Number(body?.total ?? rows.length), last_page: Number(body?.last_page ?? 1) } satisfies AuditLogResponse;
  },
};
