"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/payment/payment.service";
import type {
  PaymentActionPayload,
  PaymentListParams,
  PaymentPayload,
} from "@/types/payment/payment.type";

export const paymentKeys = {
  all: ["payment"] as const,
  list: (params: PaymentListParams = {}) => ["payment", "list", params] as const,
  detail: (id: number | string) => ["payment", "detail", id] as const,
};

export function usePaymentRequests(params: PaymentListParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentService.list(params),
  });
}

export function usePaymentRequest(id?: number | string) {
  return useQuery({
    queryKey: paymentKeys.detail(id ?? ""),
    queryFn: () => paymentService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useCreatePaymentRequest(onSuccess?: (request: Awaited<ReturnType<typeof paymentService.create>>) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentPayload) => paymentService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      onSuccess?.(data);
    },
  });
}

export function usePaymentAction(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: PaymentActionPayload }) =>
      paymentService.action(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(variables.id) });
      queryClient.refetchQueries({ queryKey: paymentKeys.detail(variables.id) });
      onSuccess?.();
    },
  });
}
