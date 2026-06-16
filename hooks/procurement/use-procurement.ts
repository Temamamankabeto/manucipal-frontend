"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { procurementService } from "@/services/procurement/procurement.service";
import type { ProcurementActionPayload, ProcurementListParams, ProcurementPayload } from "@/types/procurement/procurement.type";
export const procurementKeys = { all: ["procurement"] as const, list: (p: ProcurementListParams = {}) => ["procurement", "list", p] as const, detail: (id: number | string) => ["procurement", "detail", id] as const };
export function useProcurementRequests(params: ProcurementListParams = {}) { return useQuery({ queryKey: procurementKeys.list(params), queryFn: () => procurementService.list(params) }); }
export function useProcurementRequest(id?: number | string) { return useQuery({ queryKey: procurementKeys.detail(id ?? ""), queryFn: () => procurementService.show(id as number | string), enabled: Boolean(id) }); }
export function useCreateProcurementRequest(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (payload: ProcurementPayload) => procurementService.create(payload), onSuccess: () => { qc.invalidateQueries({ queryKey: procurementKeys.all }); onSuccess?.(); } }); }
export function useProcurementAction(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, payload }: { id: number | string; payload: ProcurementActionPayload }) => procurementService.action(id, payload), onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: procurementKeys.all }); qc.invalidateQueries({ queryKey: procurementKeys.detail(v.id) }); qc.refetchQueries({ queryKey: procurementKeys.detail(v.id) }); onSuccess?.(); } }); }
