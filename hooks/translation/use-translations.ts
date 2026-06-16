"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { translationService, type TranslationListParams, type TranslationPayload } from "@/services/translations/translation.service";

const key = ["translations"];

export function useTranslationsQuery(params: TranslationListParams) {
  return useQuery({
    queryKey: [...key, params],
    queryFn: () => translationService.list(params),
  });
}

export function useCreateTranslationMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TranslationPayload) => translationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useUpdateTranslationMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TranslationPayload }) => translationService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      onSuccess?.();
    },
  });
}

export function useDeleteTranslationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => translationService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
