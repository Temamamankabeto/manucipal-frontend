import api, { unwrap } from "@/lib/api";
import type { ApiEnvelope, PaginatedResponse, PermissionItem, PermissionListParams, PermissionPayload } from "@/types/user-management/user.type";
function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) { const out: Record<string, unknown> = {}; Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== "") out[k] = v; }); return out; }
function paginated<T>(body: any): PaginatedResponse<T> { const data = Array.isArray(body?.data) ? body.data : []; const meta = body?.meta ?? {}; return { data, meta: { current_page: Number(meta.current_page ?? 1), per_page: Number(meta.per_page ?? data.length ?? 10), total: Number(meta.total ?? data.length ?? 0), last_page: Number(meta.last_page ?? 1) } }; }
export const permissionService = {
 async list(params: PermissionListParams = {}) { const r = await api.get("/admin/permissions", { params: cleanParams(params) }); return paginated<PermissionItem>(r.data); },
 async all(search?: string) { const r = await api.get("/admin/permissions", { params: cleanParams({ all: true, search }) }); return Array.isArray(r.data?.data) ? r.data.data as PermissionItem[] : []; },
 async create(payload: PermissionPayload) { const r = await api.post("/admin/permissions", payload); return unwrap<ApiEnvelope<PermissionItem>>(r); },
 async update(id: number | string, payload: PermissionPayload) { const r = await api.put(`/admin/permissions/${id}`, payload); return unwrap<ApiEnvelope<PermissionItem>>(r); },
 async remove(id: number | string) { const r = await api.delete(`/admin/permissions/${id}`); return unwrap<ApiEnvelope<null>>(r); },
};
export default permissionService;
