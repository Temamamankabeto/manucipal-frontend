import api, { unwrap } from "@/lib/api";
import type { ApiEnvelope, Paginated, ProcurementActionPayload, ProcurementListParams, ProcurementPayload, ProcurementRequest } from "@/types/procurement/procurement.type";

function hasAttachments(payload: ProcurementPayload | Partial<ProcurementPayload>) {
  return Array.isArray(payload.attachments) && payload.attachments.length > 0;
}

function toProcurementFormData(payload: ProcurementPayload | Partial<ProcurementPayload>) {
  const form = new FormData();

  if (payload.requester_type) form.append("requester_type", payload.requester_type);
  if (payload.category_id) form.append("category_id", String(payload.category_id));
  if (payload.procurement_type_id) form.append("procurement_type_id", String(payload.procurement_type_id));
  if (payload.title) form.append("title", payload.title);
  if (payload.description) form.append("description", payload.description);
  if (payload.submission_method) form.append("submission_method", payload.submission_method);

  payload.items?.forEach((item, index) => {
    form.append(`items[${index}][item_name]`, item.item_name);
    form.append(`items[${index}][specification]`, item.specification ?? "");
    form.append(`items[${index}][quantity]`, String(item.quantity));
    form.append(`items[${index}][unit]`, item.unit);
    form.append(`items[${index}][estimated_unit_cost]`, String(item.estimated_unit_cost ?? 0));
  });

  payload.attachments?.forEach((file) => {
    form.append("attachments[]", file);
  });

  return form;
}

function clean(params: Record<string, unknown>) { return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all")); }
function toPaginated<T>(body: any): Paginated<T> { const data = Array.isArray(body?.data) ? body.data : []; const meta = body?.meta ?? {}; return { success: body?.success ?? true, message: body?.message, data, meta: { current_page: Number(meta.current_page ?? 1), per_page: Number(meta.per_page ?? data.length ?? 10), total: Number(meta.total ?? data.length ?? 0), last_page: Number(meta.last_page ?? 1) } }; }
export const procurementService = {
  async list(params: ProcurementListParams = {}) { const r = await api.get("/admin/procurement-requests", { params: clean(params) }); return toPaginated<ProcurementRequest>(r.data); },
  async show(id: number | string) { const r = await api.get(`/admin/procurement-requests/${id}`); return unwrap<ApiEnvelope<ProcurementRequest>>(r).data; },
  async create(payload: ProcurementPayload) {
    const body = hasAttachments(payload) ? toProcurementFormData(payload) : payload;
    const r = await api.post(
      "/admin/procurement-requests",
      body,
      hasAttachments(payload) ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
    return unwrap<ApiEnvelope<ProcurementRequest>>(r).data;
  },
  async update(id: number | string, payload: Partial<ProcurementPayload>) { const r = await api.put(`/admin/procurement-requests/${id}`, payload); return unwrap<ApiEnvelope<ProcurementRequest>>(r).data; },
  async action(id: number | string, payload: ProcurementActionPayload) { const r = await api.post(`/admin/procurement-requests/${id}/action`, payload); return unwrap<ApiEnvelope<ProcurementRequest>>(r).data; },
};
