"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentMasterDataService } from "@/services/payment/payment-master-data.service";
import type {
  PaymentCategoryPayload,
  PaymentMasterDataParams,
  PaymentTypePayload,
} from "@/types/payment/payment-master-data.type";

export const paymentMasterDataKeys = {
  categories: (params: PaymentMasterDataParams = {}) => ["payment-categories", params] as const,
  types: (params: PaymentMasterDataParams = {}) => ["payment-types", params] as const,
};

export function usePaymentCategories(params: PaymentMasterDataParams = {}) {
  return useQuery({
    queryKey: paymentMasterDataKeys.categories(params),
    queryFn: () => paymentMasterDataService.listCategories(params),
  });
}

export function usePaymentTypes(params: PaymentMasterDataParams = {}) {
  return useQuery({
    queryKey: paymentMasterDataKeys.types(params),
    queryFn: () => paymentMasterDataService.listTypes(params),
  });
}

export function useCreatePaymentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentCategoryPayload) => paymentMasterDataService.createCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-categories"] }),
  });
}

export function useUpdatePaymentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: PaymentCategoryPayload }) => paymentMasterDataService.updateCategory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-categories"] }),
  });
}

export function useDeletePaymentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => paymentMasterDataService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-categories"] });
      queryClient.invalidateQueries({ queryKey: ["payment-types"] });
    },
  });
}

export function useCreatePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentTypePayload) => paymentMasterDataService.createType(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-types"] }),
  });
}

export function useUpdatePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: PaymentTypePayload }) => paymentMasterDataService.updateType(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-types"] }),
  });
}

export function useDeletePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => paymentMasterDataService.deleteType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-types"] }),
  });
}
