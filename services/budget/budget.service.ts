import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  Budget,
  BudgetBalanceResponse,
  BudgetListParams,
  BudgetPayload,
  BudgetTransaction,
  Paginated,
} from "@/types/budget/budget.type";

function clean(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "all")
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

export const budgetService = {
  async list(params: BudgetListParams = {}) {
    const response = await api.get("/admin/budgets", { params: clean(params) });
    return toPaginated<Budget>(response.data);
  },

  async show(id: number | string) {
    const response = await api.get(`/admin/budgets/${id}`);
    return unwrap<ApiEnvelope<Budget>>(response).data;
  },

  async summary() {
    const response = await api.get("/admin/budgets/summary");
    return unwrap<ApiEnvelope<{ allocated: string; used: string; remaining: string; total_codes: number }>>(response).data;
  },

  async fiscalYears() {
    const response = await api.get("/admin/budgets/fiscal-years");
    return unwrap<ApiEnvelope<string[]>>(response).data;
  },

  async biCodes(params: { fiscal_year?: string; payment_type_id?: number | string } = {}) {
    const response = await api.get("/admin/budgets/bi-codes", { params: clean(params) });
    return unwrap<ApiEnvelope<string[]>>(response).data;
  },

  async accountCodes(params: { fiscal_year?: string; bi_code?: string; payment_type_id?: number | string } = {}) {
    const response = await api.get("/admin/budgets/account-codes", { params: clean(params) });
    return unwrap<ApiEnvelope<Budget[]>>(response).data;
  },

  async paymentTypeBalance(params: { fiscal_year?: string; payment_type_id?: number | string } = {}) {
    const response = await api.get("/admin/budgets/payment-type-balance", { params: clean(params) });
    const body = response.data;

    return {
      success: body?.success ?? true,
      message: body?.message,
      data: Array.isArray(body?.data) ? body.data : [],
      meta: {
        total_balance_not_committed: body?.meta?.total_balance_not_committed ?? 0,
        total_adjusted_budget: body?.meta?.total_adjusted_budget ?? 0,
        total_debit: body?.meta?.total_debit ?? 0,
      },
    } satisfies BudgetBalanceResponse;
  },

  async aggregate(params: { fiscal_year?: string } = {}) {
    const response = await api.get("/admin/budgets/aggregate", { params: clean(params) });
    return unwrap<ApiEnvelope<Budget[]>>(response).data;
  },

  async create(payload: BudgetPayload) {
    const response = await api.post("/admin/budgets", payload);
    return unwrap<ApiEnvelope<Budget>>(response).data;
  },

  async update(id: number | string, payload: BudgetPayload) {
    const response = await api.put(`/admin/budgets/${id}`, payload);
    return unwrap<ApiEnvelope<Budget>>(response).data;
  },

  async remove(id: number | string) {
    const response = await api.delete(`/admin/budgets/${id}`);
    return unwrap<ApiEnvelope<null>>(response).data;
  },

  async transactions(params: BudgetListParams & { budget_id?: number | string; type?: string; bi_code?: string; fiscal_year?: string } = {}) {
    const response = await api.get("/admin/budget-transactions", { params: clean(params) });
    return toPaginated<BudgetTransaction>(response.data);
  },
};
