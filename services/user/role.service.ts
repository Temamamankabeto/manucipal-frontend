import api, { unwrap } from "@/lib/api";
import type { ApiEnvelope, AssignRolePermissionsPayload, PaginatedResponse, PermissionItem, RoleItem, RoleListParams, RolePayload, RolePermissionResult } from "@/types/user-management/user.type";
function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) { const out: Record<string, unknown> = {}; Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== "" && v !== "all") out[k] = v; }); return out; }
function paginated<T>(body: any): PaginatedResponse<T> { const data = Array.isArray(body?.data) ? body.data : []; const meta = body?.meta ?? {}; return { data, meta: { current_page: Number(meta.current_page ?? 1), per_page: Number(meta.per_page ?? data.length ?? 10), total: Number(meta.total ?? data.length ?? 0), last_page: Number(meta.last_page ?? 1) } }; }
export const roleService = {
 async list(params: RoleListParams = {}) { const r = await api.get("/admin/roles", { params: cleanParams(params) }); return paginated<RoleItem>(r.data); },
 async create(payload: RolePayload) { const r = await api.post("/admin/roles", payload); return unwrap<ApiEnvelope<RoleItem>>(r); },
 async update(id: number | string, payload: RolePayload) { const r = await api.put(`/admin/roles/${id}`, payload); return unwrap<ApiEnvelope<RoleItem>>(r); },
 async delete(id: number | string) { const r = await api.delete(`/admin/roles/${id}`); return unwrap<ApiEnvelope<null>>(r); },
 async permissions(search?: string) { const r = await api.get("/admin/role-permissions", { params: cleanParams({ search }) }); return Array.isArray(r.data?.data) ? r.data.data as PermissionItem[] : []; },
 async rolePermissions(id: number | string) { const r = await api.get(`/admin/roles/${id}/permissions`); return Array.isArray(r.data?.data) ? r.data.data as PermissionItem[] : []; },
 async assignPermissions(id: number | string, payload: AssignRolePermissionsPayload) { const r = await api.post(`/admin/roles/${id}/permissions`, payload); return unwrap<ApiEnvelope<RolePermissionResult>>(r); },
};
export default roleService;
