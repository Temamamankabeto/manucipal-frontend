export type RoleDashboardScope =
  | "super_admin"
  | "manager"
  | "head_of_development_branch"
  | "head_of_service_branch"
  | "team_leader"
  | "expert"
  | "secretory"
  | "accountant"
  | "record_officer";

export type DashboardTab = "budget" | "procurement" | "payment";

export type RoleDashboardFilters = {
  fiscal_year?: string;
  category?: string;
  type?: string;
  date_preset?: "" | "all" | "this_week" | "this_month" | "custom";
  date_from?: string;
  date_to?: string;
  status?: string;
  bi_code?: string;
  account_code?: string;
};

export type DashboardPaymentRow = {
  id: number | string;
  payment_no?: string | null;
  category?: string | null;
  type?: string | null;
  approved_amount?: number | string | null;
  paid_amount?: number | string | null;
  status?: string | null;
  allocated_budget_code?: string | null;
  approved_date?: string | null;
};

export type DashboardProcurementRow = {
  id: number | string;
  procurement_no?: string | null;
  customer_name?: string | null;
  category?: string | null;
  type?: string | null;
  budget_code?: string | null;
  amount?: number | string | null;
  status?: string | null;
  approved_date?: string | null;
};

export type DashboardBudgetRow = {
  id: number | string;
  account_code?: string | null;
  account_description?: string | null;
  adjusted_budget?: number | string | null;
  balance_not_committed?: number | string | null;
  debit?: number | string | null;
  credit?: number | string | null;
  status?: string | null;
  bi_code?: string | null;
};

export type RoleDashboardChartRow = {
  label?: string | null;
  name?: string | null;
  value: number | string;
};

export type RoleDashboardCharts = Record<string, RoleDashboardChartRow[]>;

export type RoleDashboardData = {
  payments: DashboardPaymentRow[];
  procurements: DashboardProcurementRow[];
  budgets: DashboardBudgetRow[];
  charts: RoleDashboardCharts;
};

export type RoleDashboardResponse = {
  success: boolean;
  message: string;
  data: RoleDashboardData;
  meta?: Record<string, unknown>;
};
