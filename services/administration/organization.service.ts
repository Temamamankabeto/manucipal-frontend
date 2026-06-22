import api, { unwrap } from "@/lib/api";
import type {
  Department,
  DepartmentPayload,
  Office,
  OfficePayload,
  OrganizationParams,
  Paginated,
} from "@/types/administration/organization.type";

function clean(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"),
  );
}

function toPaginated<T>(body: any): Paginated<T> {
  const data = Array.isArray(body?.data) ? body.data : [];
  const meta = body?.meta ?? {};

  return {
    success: body?.success ?? true,
    message: body?.message,
    data,
    meta: {
      current_page: Number(meta.current_page ?? 1),
      per_page: Number(meta.per_page ?? data.length ?? 15),
      total: Number(meta.total ?? data.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

export const organizationService = {
  async listOffices(params: OrganizationParams = {}) {
    const response = await api.get("/admin/offices", { params: clean(params) });
    return toPaginated<Office>(response.data);
  },

  async allOffices(params: OrganizationParams = {}) {
    const response = await api.get("/admin/offices", { params: clean({ ...params, all: true }) });
    return Array.isArray(response.data?.data) ? (response.data.data as Office[]) : [];
  },

  async createOffice(payload: OfficePayload) {
    const response = await api.post("/admin/offices", payload);
    return unwrap<{ success: boolean; message: string; data: Office }>(response).data;
  },

  async updateOffice(id: number | string, payload: OfficePayload) {
    const response = await api.put(`/admin/offices/${id}`, payload);
    return unwrap<{ success: boolean; message: string; data: Office }>(response).data;
  },

  async deleteOffice(id: number | string) {
    const response = await api.delete(`/admin/offices/${id}`);
    return unwrap<{ success: boolean; message: string; data: null }>(response);
  },

  async listDepartments(params: OrganizationParams = {}) {
    const response = await api.get("/admin/departments", { params: clean(params) });
    return toPaginated<Department>(response.data);
  },

  async createDepartment(payload: DepartmentPayload) {
    const response = await api.post("/admin/departments", payload);
    return unwrap<{ success: boolean; message: string; data: Department }>(response).data;
  },

  async updateDepartment(id: number | string, payload: DepartmentPayload) {
    const response = await api.put(`/admin/departments/${id}`, payload);
    return unwrap<{ success: boolean; message: string; data: Department }>(response).data;
  },

  async deleteDepartment(id: number | string) {
    const response = await api.delete(`/admin/departments/${id}`);
    return unwrap<{ success: boolean; message: string; data: null }>(response);
  },
};
