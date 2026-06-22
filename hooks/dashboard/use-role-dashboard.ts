"use client";

import { useQuery } from "@tanstack/react-query";
import { roleDashboardService } from "@/services/dashboard/role-dashboard.service";
import type { DashboardTab, RoleDashboardFilters, RoleDashboardScope } from "@/types/dashboard/role-dashboard.type";

export const roleDashboardKeys = {
  all: ["role-dashboard"] as const,
  summary: (scope: RoleDashboardScope, tab: DashboardTab, filters: RoleDashboardFilters) =>
    ["role-dashboard", scope, tab, filters] as const,
};

export function useRoleDashboard(scope: RoleDashboardScope, tab: DashboardTab, filters: RoleDashboardFilters) {
  return useQuery({
    queryKey: roleDashboardKeys.summary(scope, tab, filters),
    queryFn: () => roleDashboardService.summary(scope, tab, filters),
  });
}
