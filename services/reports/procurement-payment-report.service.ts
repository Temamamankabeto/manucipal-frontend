import api, { unwrap } from "@/lib/api";
import type { ProcurementPaymentSummary } from "@/types/reports/procurement-payment-report.type";

type Envelope<T> = { success: boolean; message: string; data: T };

export const procurementPaymentReportService = {
  async summary() {
    const r = await api.get("/admin/procurement-payment-reports/summary");
    return unwrap<Envelope<ProcurementPaymentSummary>>(r).data;
  },
};
