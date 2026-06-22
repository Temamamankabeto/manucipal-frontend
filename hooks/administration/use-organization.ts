"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationService } from "@/services/administration/organization.service";
import type { DepartmentPayload, OfficePayload, OrganizationParams } from "@/types/administration/organization.type";

export const organizationKeys = {
  offices: (params: OrganizationParams = {}) => ["offices", params] as const,
  officesAll: (params: OrganizationParams = {}) => ["offices-all", params] as const,
  departments: (params: OrganizationParams = {}) => ["departments", params] as const,
};

export function useOffices(params: OrganizationParams = {}) {
  return useQuery({ queryKey: organizationKeys.offices(params), queryFn: () => organizationService.listOffices(params) });
}

export function useAllOffices(params: OrganizationParams = {}) {
  return useQuery({ queryKey: organizationKeys.officesAll(params), queryFn: () => organizationService.allOffices(params) });
}

export function useDepartments(params: OrganizationParams = {}) {
  return useQuery({ queryKey: organizationKeys.departments(params), queryFn: () => organizationService.listDepartments(params) });
}

export function useCreateOffice() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: OfficePayload) => organizationService.createOffice(payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offices"] }) });
}

export function useUpdateOffice() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number | string; payload: OfficePayload }) => organizationService.updateOffice(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offices"] }) });
}

export function useDeleteOffice() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: number | string) => organizationService.deleteOffice(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["offices"] }); queryClient.invalidateQueries({ queryKey: ["departments"] }); } });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: DepartmentPayload) => organizationService.createDepartment(payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }) });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number | string; payload: DepartmentPayload }) => organizationService.updateDepartment(id, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }) });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: number | string) => organizationService.deleteDepartment(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }) });
}
