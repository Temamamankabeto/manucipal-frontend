"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procurementMasterDataService } from "@/services/procurement/procurement-master-data.service";
import type {
  ProcurementCategoryPayload,
  ProcurementMasterDataParams,
  ProcurementTypePayload,
} from "@/types/procurement/procurement-master-data.type";

export const procurementMasterDataKeys = {
  all: ["procurement-master-data"] as const,
  categories: (params: ProcurementMasterDataParams = {}) => ["procurement-master-data", "categories", params] as const,
  types: (params: ProcurementMasterDataParams = {}) => ["procurement-master-data", "types", params] as const,
};

export function useProcurementCategories(params: ProcurementMasterDataParams = {}) {
  return useQuery({
    queryKey: procurementMasterDataKeys.categories(params),
    queryFn: () => procurementMasterDataService.listCategories(params),
  });
}

export function useProcurementTypes(params: ProcurementMasterDataParams = {}) {
  return useQuery({
    queryKey: procurementMasterDataKeys.types(params),
    queryFn: () => procurementMasterDataService.listTypes(params),
  });
}

export function useCreateProcurementCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcurementCategoryPayload) => procurementMasterDataService.createCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementMasterDataKeys.all }),
  });
}

export function useUpdateProcurementCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ProcurementCategoryPayload }) =>
      procurementMasterDataService.updateCategory(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementMasterDataKeys.all }),
  });
}

export function useDeleteProcurementCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => procurementMasterDataService.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementMasterDataKeys.all }),
  });
}

export function useCreateProcurementType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcurementTypePayload) => procurementMasterDataService.createType(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementMasterDataKeys.all }),
  });
}

export function useUpdateProcurementType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ProcurementTypePayload }) =>
      procurementMasterDataService.updateType(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementMasterDataKeys.all }),
  });
}

export function useDeleteProcurementType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => procurementMasterDataService.deleteType(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementMasterDataKeys.all }),
  });
}
