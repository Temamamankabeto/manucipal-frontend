import api, { unwrap } from "@/lib/api";
import type {
  Paginated,
  ProcurementCategory,
  ProcurementCategoryPayload,
  ProcurementMasterDataParams,
  ProcurementType,
  ProcurementTypePayload,
} from "@/types/procurement/procurement-master-data.type";

function clean(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"),
  );
}

function toPaginated<T>(body: any): Paginated<T> {
  const payload = body?.success !== undefined ? body : body?.data ?? body;
  const rawData = payload?.data;
  const data = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(payload)
        ? payload
        : [];
  const meta = payload?.meta ?? rawData?.meta ?? payload ?? {};

  return {
    success: payload?.success ?? true,
    message: payload?.message,
    data,
    meta: {
      current_page: Number(meta.current_page ?? rawData?.current_page ?? 1),
      per_page: Number(meta.per_page ?? rawData?.per_page ?? data.length ?? 15),
      total: Number(meta.total ?? rawData?.total ?? data.length ?? 0),
      last_page: Number(meta.last_page ?? rawData?.last_page ?? 1),
    },
  };
}

export const procurementMasterDataService = {
  async listCategories(params: ProcurementMasterDataParams = {}) {
    const response = await api.get("/admin/procurement-categories", { params: clean(params) });
    return toPaginated<ProcurementCategory>(response.data);
  },

  async createCategory(payload: ProcurementCategoryPayload) {
    const response = await api.post("/admin/procurement-categories", payload);
    return unwrap<{ success: boolean; message: string; data: ProcurementCategory }>(response).data;
  },

  async updateCategory(id: number | string, payload: ProcurementCategoryPayload) {
    const response = await api.put(`/admin/procurement-categories/${id}`, payload);
    return unwrap<{ success: boolean; message: string; data: ProcurementCategory }>(response).data;
  },

  async deleteCategory(id: number | string) {
    const response = await api.delete(`/admin/procurement-categories/${id}`);
    return unwrap<{ success: boolean; message: string; data: null }>(response);
  },

  async listTypes(params: ProcurementMasterDataParams = {}) {
    const response = await api.get("/admin/procurement-types", { params: clean(params) });
    return toPaginated<ProcurementType>(response.data);
  },

  async createType(payload: ProcurementTypePayload) {
    const response = await api.post("/admin/procurement-types", payload);
    return unwrap<{ success: boolean; message: string; data: ProcurementType }>(response).data;
  },

  async updateType(id: number | string, payload: ProcurementTypePayload) {
    const response = await api.put(`/admin/procurement-types/${id}`, payload);
    return unwrap<{ success: boolean; message: string; data: ProcurementType }>(response).data;
  },

  async deleteType(id: number | string) {
    const response = await api.delete(`/admin/procurement-types/${id}`);
    return unwrap<{ success: boolean; message: string; data: null }>(response);
  },
};
