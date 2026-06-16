"use client";
import { useQuery } from "@tanstack/react-query";
import { procurementPaymentReportService } from "@/services/reports/procurement-payment-report.service";

export function useProcurementPaymentSummary() {
  return useQuery({ queryKey: ["procurement-payment-reports", "summary"], queryFn: () => procurementPaymentReportService.summary() });
}
