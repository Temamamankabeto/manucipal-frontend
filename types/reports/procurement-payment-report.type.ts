export type StatusCount = { status: string; total: number };
export type ProcurementPaymentSummary = {
  procurement: { total: number; pending: number; completed: number; rejected: number; by_status: StatusCount[] };
  payment: { total: number; pending: number; completed: number; rejected: number; total_amount: number; completed_amount: number; by_status: StatusCount[] };
};
