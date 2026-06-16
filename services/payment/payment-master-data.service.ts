import api, { unwrap } from "@/lib/api";
import type {
  Paginated,
  PaymentCategory,
  PaymentCategoryPayload,
  PaymentMasterDataParams,
  PaymentType,
  PaymentTypePayload,
} from "@/types/payment/payment-master-data.type";

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

export const paymentMasterDataService = {
  async listCategories(params: PaymentMasterDataParams = {}) {
    const response = await api.get("/admin/payment-categories", { params: clean(params) });
    return toPaginated<PaymentCategory>(response.data);
  },

  async createCategory(payload: PaymentCategoryPayload) {
    const response = await api.post("/admin/payment-categories", payload);
    return unwrap<{ success: boolean; message: string; data: PaymentCategory }>(response).data;
  },

  async updateCategory(id: number | string, payload: PaymentCategoryPayload) {
    const response = await api.put(`/admin/payment-categories/${id}`, payload);
    return unwrap<{ success: boolean; message: string; data: PaymentCategory }>(response).data;
  },

  async deleteCategory(id: number | string) {
    const response = await api.delete(`/admin/payment-categories/${id}`);
    return unwrap<{ success: boolean; message: string; data: null }>(response);
  },

  async listTypes(params: PaymentMasterDataParams = {}) {
    const response = await api.get("/admin/payment-types", { params: clean(params) });
    return toPaginated<PaymentType>(response.data);
  },

  async createType(payload: PaymentTypePayload) {
    const response = await api.post("/admin/payment-types", payload);
    return unwrap<{ success: boolean; message: string; data: PaymentType }>(response).data;
  },

  async updateType(id: number | string, payload: PaymentTypePayload) {
    const response = await api.put(`/admin/payment-types/${id}`, payload);
    return unwrap<{ success: boolean; message: string; data: PaymentType }>(response).data;
  },

  async deleteType(id: number | string) {
    const response = await api.delete(`/admin/payment-types/${id}`);
    return unwrap<{ success: boolean; message: string; data: null }>(response);
  },
};
