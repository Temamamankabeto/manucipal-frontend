import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { permissionService } from "@/services/user/permission.service";
import type { PermissionListParams, PermissionPayload } from "@/types/user-management/user.type";
const keys = { root: ["permissions"] as const, list: (p: unknown) => ["permissions", "list", p] as const, all: (s?: string) => ["permissions", "all", s ?? ""] as const };
export function usePermissionsQuery(params: PermissionListParams = {}) { return useQuery({ queryKey: keys.list(params), queryFn: () => permissionService.list(params) }); }
export function useAllPermissionsQuery(search?: string) { return useQuery({ queryKey: keys.all(search), queryFn: () => permissionService.all(search) }); }
export function useCreatePermissionMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (payload: PermissionPayload) => permissionService.create(payload), onSuccess: () => { qc.invalidateQueries({ queryKey: keys.root }); toast.success("Permission created"); onSuccess?.(); } }); }
export function useUpdatePermissionMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, payload }: { id: number | string; payload: PermissionPayload }) => permissionService.update(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: keys.root }); toast.success("Permission updated"); onSuccess?.(); } }); }
export function useDeletePermissionMutation(onSuccess?: () => void) { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number | string) => permissionService.remove(id), onSuccess: () => { qc.invalidateQueries({ queryKey: keys.root }); toast.success("Permission deleted"); onSuccess?.(); } }); }
