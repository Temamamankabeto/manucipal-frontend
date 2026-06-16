"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officeService } from "@/services/location/office.service";
import type { OfficeListParams, OfficePayload, OfficeType } from "@/types/location/office.type";
export const officeKeys = { all: ["locations"] as const, legacyList: (p: OfficeListParams = {}) => ["locations", "offices", p] as const, legacyAll: (p: OfficeListParams = {}) => ["locations", "offices-all", p] as const, tree: (s?: string) => ["locations", "tree", s ?? "active"] as const, levelList: (t: OfficeType, p: OfficeListParams = {}) => ["locations", t, "list", p] as const, levelAll: (t: OfficeType, p: OfficeListParams = {}) => ["locations", t, "all", p] as const, detail: (id: number | string) => ["locations", "detail", id] as const };
export function useOfficesQuery(params: OfficeListParams = {}) { return useQuery({ queryKey: officeKeys.legacyList(params), queryFn: () => officeService.list(params) }); }
export function useAllOfficesQuery(params: OfficeListParams = {}) { return useQuery({ queryKey: officeKeys.legacyAll(params), queryFn: () => officeService.all(params) }); }
export function useOfficeTreeQuery(status: OfficeListParams["status"] = "active") { return useQuery({ queryKey: officeKeys.tree(status), queryFn: () => officeService.tree(status) }); }
export function useOfficeQuery(id?: number | string) { return useQuery({ queryKey: officeKeys.detail(id ?? ""), queryFn: () => officeService.show(id as number | string), enabled: Boolean(id) }); }
export function useLocationLevelQuery(type: OfficeType, params: OfficeListParams = {}) { return useQuery({ queryKey: officeKeys.levelList(type, params), queryFn: () => officeService.listLevel(type, params) }); }
export function useLocationLevelAllQuery(type: OfficeType, params: OfficeListParams = {}) { return useQuery({ queryKey: officeKeys.levelAll(type, params), queryFn: () => officeService.allLevel(type, params) }); }
export const useCitiesQuery = (p: OfficeListParams = {}) => useLocationLevelQuery("city", p);
export const useAllCitiesQuery = (p: OfficeListParams = {}) => useLocationLevelAllQuery("city", p);
export const useSubcitiesQuery = (p: OfficeListParams = {}) => useLocationLevelQuery("subcity", p);
export const useAllSubcitiesQuery = (p: OfficeListParams = {}) => useLocationLevelAllQuery("subcity", p);
export const useWoredasQuery = (p: OfficeListParams = {}) => useLocationLevelQuery("woreda", p);
export const useAllWoredasQuery = (p: OfficeListParams = {}) => useLocationLevelAllQuery("woreda", p);
export const useZonesQuery = (p: OfficeListParams = {}) => useLocationLevelQuery("zone", p);
export const useAllZonesQuery = (p: OfficeListParams = {}) => useLocationLevelAllQuery("zone", p);
export function useCreateOfficeMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (payload: OfficePayload) => officeService.create(payload), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useUpdateOfficeMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, payload }: { id: number | string; payload: OfficePayload }) => officeService.update(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useToggleOfficeMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number | string) => officeService.toggle(id), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useDeleteOfficeMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number | string) => officeService.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useCreateLocationMutation(type: OfficeType, onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (payload: OfficePayload) => officeService.createLevel(type, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useUpdateLocationMutation(type: OfficeType, onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, payload }: { id: number | string; payload: OfficePayload }) => officeService.updateLevel(type, id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useToggleLocationMutation(type: OfficeType, onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number | string) => officeService.toggleLevel(type, id), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
export function useDeleteLocationMutation(type: OfficeType, onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number | string) => officeService.removeLevel(type, id), onSuccess: () => { qc.invalidateQueries({ queryKey: officeKeys.all }); onSuccess?.(); } }); }
