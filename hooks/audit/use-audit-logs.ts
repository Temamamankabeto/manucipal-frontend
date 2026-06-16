"use client";
import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit/audit-log.service";

export function useAuditLogs(params: { entity_type?: string; action?: string; per_page?: number } = {}) {
  return useQuery({ queryKey: ["audit-logs", params], queryFn: () => auditLogService.list(params) });
}
