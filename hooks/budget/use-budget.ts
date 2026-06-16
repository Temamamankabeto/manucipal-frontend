"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "@/services/budget/budget.service";
import type { BudgetListParams, BudgetPayload } from "@/types/budget/budget.type";

export const budgetKeys = {
  all: ["budgets"] as const,
  list: (params: BudgetListParams = {}) => ["budgets", "list", params] as const,
  detail: (id?: number | string | null) => ["budgets", "detail", id] as const,
  summary: ["budgets", "summary"] as const,
  fiscalYears: ["budgets", "fiscal-years"] as const,
  biCodes: (params: { fiscal_year?: string; payment_type_id?: number | string } = {}) => ["budgets", "bi-codes", params] as const,
  accountCodes: (params: { fiscal_year?: string; bi_code?: string; payment_type_id?: number | string } = {}) => ["budgets", "account-codes", params] as const,
  paymentTypeBalance: (params: { fiscal_year?: string; payment_type_id?: number | string } = {}) => ["budgets", "payment-type-balance", params] as const,
  aggregate: (params: { fiscal_year?: string } = {}) => ["budgets", "aggregate", params] as const,
  transactions: (params: BudgetListParams & { budget_id?: number | string; type?: string; bi_code?: string; fiscal_year?: string } = {}) => ["budgets", "transactions", params] as const,
};

export function useBudgets(params: BudgetListParams = {}) {
  return useQuery({
    queryKey: budgetKeys.list(params),
    queryFn: () => budgetService.list(params),
  });
}

export function useBudgetDetail(id?: number | string | null) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => budgetService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: budgetKeys.summary,
    queryFn: () => budgetService.summary(),
  });
}

export function useBudgetFiscalYears() {
  return useQuery({
    queryKey: budgetKeys.fiscalYears,
    queryFn: () => budgetService.fiscalYears(),
  });
}

export function useBudgetBiCodes(params: { fiscal_year?: string; payment_type_id?: number | string } = {}, enabled = true) {
  return useQuery({
    queryKey: budgetKeys.biCodes(params),
    queryFn: () => budgetService.biCodes(params),
    enabled,
  });
}

export function useBudgetAccountCodes(params: { fiscal_year?: string; bi_code?: string; payment_type_id?: number | string } = {}, enabled = true) {
  return useQuery({
    queryKey: budgetKeys.accountCodes(params),
    queryFn: () => budgetService.accountCodes(params),
    enabled,
  });
}

export function usePaymentTypeBudgetBalance(params: { fiscal_year?: string; payment_type_id?: number | string } = {}, enabled = true) {
  return useQuery({
    queryKey: budgetKeys.paymentTypeBalance(params),
    queryFn: () => budgetService.paymentTypeBalance(params),
    enabled,
  });
}

export function useBudgetAggregate(params: { fiscal_year?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: budgetKeys.aggregate(params),
    queryFn: () => budgetService.aggregate(params),
    enabled,
  });
}

export function useBudgetTransactions(params: BudgetListParams & { budget_id?: number | string; type?: string; bi_code?: string; fiscal_year?: string } = {}) {
  return useQuery({
    queryKey: budgetKeys.transactions(params),
    queryFn: () => budgetService.transactions(params),
  });
}

export function useCreateBudget(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetPayload) => budgetService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      onSuccess?.();
    },
  });
}

export function useUpdateBudget(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: BudgetPayload }) => budgetService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      onSuccess?.();
    },
  });
}

export function useDeleteBudget(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => budgetService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      onSuccess?.();
    },
  });
}
