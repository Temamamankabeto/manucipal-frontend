import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  Paginated,
  PaymentActionPayload,
  PaymentDepartment,
  PaymentListParams,
  PaymentPayload,
  PaymentRequest,
} from "@/types/payment/payment.type";
import type { UserItem } from "@/types/user-management/user.type";

function clean(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all",
    ),
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
      per_page: Number(meta.per_page ?? data.length ?? 10),
      total: Number(meta.total ?? data.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

function hasAttachments(payload: PaymentPayload | Partial<PaymentPayload>) {
  return Array.isArray(payload.attachments) && payload.attachments.length > 0;
}

function toPaymentFormData(payload: PaymentPayload | Partial<PaymentPayload>) {
  const form = new FormData();

  if (payload.requester_type)
    form.append("requester_type", payload.requester_type);
  if (payload.requesting_entity)
    form.append("requesting_entity", payload.requesting_entity);
  if (payload.current_handler_id)
    form.append("current_handler_id", String(payload.current_handler_id));
  if (payload.request_type) form.append("request_type", payload.request_type);
  if (payload.payment_category_id)
    form.append("payment_category_id", String(payload.payment_category_id));
  if (payload.payment_type_id)
    form.append("payment_type_id", String(payload.payment_type_id));
  if (payload.budget_id)
    form.append("budget_id", String(payload.budget_id));
  if (payload.payment_category)
    form.append("payment_category", payload.payment_category);
  if (payload.title) form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  if (payload.amount !== undefined)
    form.append("amount", String(payload.amount));

  payload.items?.forEach((item, index) => {
    form.append(`items[${index}][description]`, item.description);
    form.append(`items[${index}][quantity]`, String(item.quantity ?? 1));
    form.append(`items[${index}][unit]`, item.unit ?? "service");
    form.append(`items[${index}][unit_price]`, String(item.unit_price ?? item.amount ?? 0));
    form.append(`items[${index}][remark]`, item.remark ?? "");
  });

  payload.attachments?.forEach((file) => {
    form.append("attachments[]", file);
  });

  return form;
}

export const paymentService = {
  async initialApprovers() {
    const response = await api.get("/admin/payment-requests-initial-approvers");
    return Array.isArray(response.data?.data) ? (response.data.data as UserItem[]) : [];
  },

  async planningBudgetExperts(departmentId?: number | string | null) {
    if (departmentId) {
      const response = await api.get(`/admin/payment-departments/${departmentId}/experts`);
      return Array.isArray(response.data?.data) ? (response.data.data as UserItem[]) : [];
    }

    const response = await api.get("/admin/payment-requests-planning-budget-experts");
    return Array.isArray(response.data?.data) ? (response.data.data as UserItem[]) : [];
  },

  async departments() {
    try {
      const response = await api.get("/admin/payment-departments");
      return Array.isArray(response.data?.data) ? (response.data.data as PaymentDepartment[]) : [];
    } catch (error) {
      const response = await api.get("/admin/departments");
      return Array.isArray(response.data?.data) ? (response.data.data as PaymentDepartment[]) : [];
    }
  },

  async departmentTeamLeaders(departmentId: number | string) {
    const response = await api.get(`/admin/payment-departments/${departmentId}/team-leaders`);
    return Array.isArray(response.data?.data) ? (response.data.data as UserItem[]) : [];
  },

  async list(params: PaymentListParams = {}) {
    const response = await api.get("/admin/payment-requests", {
      params: clean(params),
    });
    return toPaginated<PaymentRequest>(response.data);
  },

  async show(id: number | string) {
    const response = await api.get(`/admin/payment-requests/${id}`);
    return unwrap<ApiEnvelope<PaymentRequest>>(response).data;
  },

  async create(payload: PaymentPayload) {
    const body = hasAttachments(payload) ? toPaymentFormData(payload) : payload;
    const response = await api.post(
      "/admin/payment-requests",
      body,
      hasAttachments(payload)
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );

    return unwrap<ApiEnvelope<PaymentRequest>>(response).data;
  },

  async update(id: number | string, payload: Partial<PaymentPayload>) {
    const body = hasAttachments(payload) ? toPaymentFormData(payload) : payload;
    const response = await api.post(
      `/admin/payment-requests/${id}`,
      body,
      hasAttachments(payload)
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );

    return unwrap<ApiEnvelope<PaymentRequest>>(response).data;
  },

  async action(id: number | string, payload: PaymentActionPayload) {
    const response = await api.post(
      `/admin/payment-requests/${id}/action`,
      payload,
    );
    return unwrap<ApiEnvelope<PaymentRequest>>(response).data;
  },
};
