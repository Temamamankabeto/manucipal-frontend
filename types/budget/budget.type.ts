export type ApiMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta | null;
};

export type Paginated<T> = {
  success: boolean;
  message?: string;
  data: T[];
  meta: ApiMeta;
};

export type Budget = {
  id: number;
  bi_code: string;
  reporting_unit?: string | null;
  month_year?: string | null;
  bank_account_code?: string | null;
  source_of_finance?: string | null;
  budget_type?: string | null;
  budget_code: string;
  account_name: string;
  fiscal_year?: string | null;
  allocated_amount: number | string;
  used_amount: number | string;
  remaining_amount: number | string;
  status: "active" | "inactive";
  description?: string | null;
  transactions_count?: number;
  created_at?: string;
  transactions?: BudgetTransaction[];
};

export type BudgetPayload = {
  bi_code: string;
  reporting_unit?: string | null;
  month_year?: string | null;
  bank_account_code?: string | null;
  source_of_finance?: string | null;
  budget_type?: string | null;
  budget_code: string;
  account_name: string;
  fiscal_year?: string | null;
  allocated_amount: number | string;
  status?: "active" | "inactive";
  description?: string | null;
};

export type BudgetTransaction = {
  id: number;
  transaction_no: string;
  type: "DEBIT" | "REVERSAL" | "ADJUSTMENT";
  amount: number | string;
  balance_before: number | string;
  balance_after: number | string;
  remarks?: string | null;
  created_at: string;
  budget?: Pick<Budget, "id" | "bi_code" | "budget_code" | "account_name" | "fiscal_year">;
  payment?: { id: number; payment_no: string; title: string; status: string; amount: number | string } | null;
  creator?: { id: number; name: string } | null;
};

export type BudgetListParams = {
  search?: string;
  status?: string;
  bi_code?: string;
  fiscal_year?: string;
  page?: number;
  per_page?: number;
  aggregate?: boolean;
};

export type BudgetBalanceResponse = {
  success: boolean;
  message?: string;
  data: Budget[];
  meta: {
    total_balance_not_committed: number | string;
    total_adjusted_budget: number | string;
    total_debit: number | string;
  };
};
