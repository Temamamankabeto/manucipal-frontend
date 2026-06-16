"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth/auth.service";
import { AlertTriangle, Edit, Eye, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useBudgetDetail,
  useBudgets,
  useBudgetTransactions,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "@/hooks/budget/use-budget";
import type { Budget, BudgetPayload } from "@/types/budget/budget.type";

const LOW_BUDGET_THRESHOLD = 5000;


const BUDGET_MANAGER_ROLES = new Set([
  "planning-budget-team-leader",
  "planning-and-budget-team-leader",
]);

function normalizeRole(role?: string | null) {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const emptyForm: BudgetPayload = {
  bi_code: "04/21/000/152/01/01",
  reporting_unit: "04/21/000/152/01/01 - Office of Finance and Economic Development - Administration and General Service",
  bank_account_code: "29 - Mana Qopheessaa",
  source_of_finance: "1900",
  budget_type: "1 - Recurrent",
  budget_code: "",
  account_name: "",
  fiscal_year: "2018",
  allocated_amount: 0,
  status: "active",
  description: "",
};

function toForm(budget: Budget): BudgetPayload {
  return {
    bi_code: budget.bi_code ?? "04/21/000/152/01/01",
    reporting_unit: budget.reporting_unit ?? "",
    bank_account_code: budget.bank_account_code ?? "",
    source_of_finance: budget.source_of_finance ?? "1900",
    budget_type: budget.budget_type ?? "1 - Recurrent",
    budget_code: budget.budget_code,
    account_name: budget.account_name,
    fiscal_year: budget.fiscal_year ?? "",
    allocated_amount: budget.allocated_amount,
    status: budget.status,
    description: budget.description ?? "",
  };
}

export default function BudgetsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [biCode, setBiCode] = useState("04/21/000/152/01/01");
  const [fiscalYear, setFiscalYear] = useState("2018");
  const [showAggregate, setShowAggregate] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [viewing, setViewing] = useState<Budget | null>(null);
  const [form, setForm] = useState<BudgetPayload>(emptyForm);

  const storedUser = authService.getStoredUser();
  const role = authService.getStoredRoles()[0] ?? storedUser?.role ?? "";
  const normalizedRole = normalizeRole(role);
  const canManageBudget = BUDGET_MANAGER_ROLES.has(normalizedRole);

  const budgetsQuery = useBudgets({
    search,
    status,
    bi_code: showAggregate ? "all" : biCode,
    fiscal_year: fiscalYear,
    page,
    per_page: 15,
    aggregate: showAggregate,
  });
  const budgets = useMemo(() => {
    const rows = budgetsQuery.data?.data ?? [];

    if (!showAggregate) {
      return rows;
    }

    const grouped = new Map<string, Budget>();

    rows.forEach((budget) => {
      const key = budget.budget_code;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          ...budget,
          bi_code: "Aggregate",
          reporting_unit: "Aggregated from all BI Codes",
          allocated_amount: Number(budget.allocated_amount ?? 0),
          used_amount: Number(budget.used_amount ?? 0),
          remaining_amount: Number(budget.remaining_amount ?? 0),
        });
        return;
      }

      grouped.set(key, {
        ...existing,
        account_name: existing.account_name || budget.account_name,
        allocated_amount: Number(existing.allocated_amount ?? 0) + Number(budget.allocated_amount ?? 0),
        used_amount: Number(existing.used_amount ?? 0) + Number(budget.used_amount ?? 0),
        remaining_amount: Number(existing.remaining_amount ?? 0) + Number(budget.remaining_amount ?? 0),
        status: existing.status === "active" || budget.status === "active" ? "active" : "inactive",
      });
    });

    return Array.from(grouped.values()).sort((a, b) => String(a.budget_code).localeCompare(String(b.budget_code)));
  }, [budgetsQuery.data?.data, showAggregate]);

  const meta = budgetsQuery.data?.meta;

  const uniqueBiCodes = useMemo(() => {
    const codes = new Set<string>([biCode]);
    budgets.forEach((budget) => budget.bi_code && codes.add(budget.bi_code));
    return Array.from(codes).filter(Boolean);
  }, [biCode, budgets]);

  const lowBudgets = budgets.filter((budget) => Number(budget.remaining_amount) < LOW_BUDGET_THRESHOLD && budget.status === "active");

  const selectedBudget = useBudgetDetail(viewing?.id);
  const transactionsQuery = useBudgetTransactions({
    budget_id: viewing?.id,
    fiscal_year: viewing?.fiscal_year ?? fiscalYear,
    per_page: 100,
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ ...emptyForm, bi_code: biCode, fiscal_year: fiscalYear });
    setFormOpen(false);
  };

  const createBudget = useCreateBudget(() => {
    toast.success("Budget created successfully");
    resetForm();
  });

  const updateBudget = useUpdateBudget(() => {
    toast.success("Budget updated successfully");
    resetForm();
  });

  const deleteBudget = useDeleteBudget(() => toast.success("Budget deleted successfully"));
  const isSubmitting = createBudget.isPending || updateBudget.isPending;

  function openCreate() {
    if (!canManageBudget) return;
    setEditing(null);
    setForm({ ...emptyForm, bi_code: biCode, fiscal_year: fiscalYear });
    setFormOpen(true);
  }

  function openEdit(budget: Budget) {
    if (!canManageBudget) return;
    setEditing(budget);
    setForm(toForm(budget));
    setFormOpen(true);
  }

  function openView(budget: Budget) {
    setViewing(budget);
    setViewOpen(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!canManageBudget) {
      toast.error("You have view-only access to Budget Management.");
      return;
    }

    if (editing) {
      updateBudget.mutate({ id: editing.id, payload: form });
      return;
    }

    createBudget.mutate(form);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Report - Recurrent Expenditure</h1>
          <p className="text-sm text-muted-foreground">{canManageBudget ? "Manage recurrent budget by BI Code, fiscal year, and account code." : "View recurrent budget by BI Code, fiscal year, and account code."} Aggregated report sums each Account Code across all BI Codes for the selected fiscal year.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowAggregate((current) => !current);
              setPage(1);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {showAggregate ? "See BI Code Report" : "See Aggregated Report"}
          </Button>
          {canManageBudget ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create Budget
            </Button>
          ) : null}
        </div>
      </div>

      {lowBudgets.length > 0 ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget recharge required</AlertTitle>
          <AlertDescription>
            {lowBudgets.length} active budget code{lowBudgets.length > 1 ? "s" : ""} under this BI Code have less than 5,000 Birr remaining. Please recharge before processing more payments.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-md border bg-white shadow-sm">
        <div className="bg-[#073763] px-4 py-2 text-center text-xl font-bold text-white">Report - Recurrent Expenditure</div>
        <div className="grid border-b text-sm md:grid-cols-2">
          <div className="border-b p-2 font-semibold md:border-r">
            Reporting Unit : {budgets[0]?.reporting_unit ?? form.reporting_unit}
          </div>
          <div className="border-b p-2 font-semibold">Bank Account Code : {budgets[0]?.bank_account_code ?? form.bank_account_code}</div>
          <div className="border-b p-2 font-semibold md:border-r">Fiscal Year : {fiscalYear}</div>
          <div className="border-b p-2 font-semibold">Source of Finance: {budgets[0]?.source_of_finance ?? "1900"}</div>
          <div className="p-2 font-semibold md:border-r">BI Code: <span className="text-red-600">{showAggregate ? "Aggregate - All BI Codes" : biCode}</span></div>
          <div className="p-2 font-semibold">Budget Type: {budgets[0]?.budget_type ?? "1 - Recurrent"}</div>
        </div>

        <div className="grid gap-3 border-b p-3 md:grid-cols-5">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search account code, BI code, or description"
          />
          <Input
            list="bi-codes"
            value={showAggregate ? "Aggregate - All BI Codes" : biCode}
            disabled={showAggregate}
            onChange={(event) => {
              setBiCode(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by BI Code"
          />
          <datalist id="bi-codes">
            {uniqueBiCodes.map((code) => <option key={code} value={code} />)}
          </datalist>
          <Input
            value={fiscalYear}
            onChange={(event) => {
              setFiscalYear(event.target.value);
              setPage(1);
            }}
            placeholder="Fiscal Year"
          />
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => { setSearch(""); setStatus("all"); setPage(1); }}>Reset</Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200 hover:bg-gray-200">
                <TableHead rowSpan={2} className="border text-center text-black">Account Code</TableHead>
                <TableHead rowSpan={2} className="border text-center text-black">Account Description</TableHead>
                <TableHead colSpan={2} className="border text-center text-black">Balance (Birr)</TableHead>
                <TableHead colSpan={2} className="border text-center text-black">YTD Expenditure (Birr)</TableHead>
                <TableHead rowSpan={2} className="border text-center text-black">Status</TableHead>
                {!showAggregate ? <TableHead rowSpan={2} className="border text-center text-black">Actions</TableHead> : null}
              </TableRow>
              <TableRow className="bg-gray-200 hover:bg-gray-200">
                <TableHead className="border text-center text-black">Adjusted Budget</TableHead>
                <TableHead className="border text-center text-black">Balance Not Committed</TableHead>
                <TableHead className="border text-center text-black">Debit</TableHead>
                <TableHead className="border text-center text-black">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const isLow = Number(budget.remaining_amount) < LOW_BUDGET_THRESHOLD && budget.status === "active";
                return (
                  <TableRow key={showAggregate ? `aggregate-${budget.budget_code}` : `${budget.bi_code ?? "bi"}-${budget.budget_code}-${budget.id ?? "row"}`} className={isLow ? "bg-amber-50" : undefined}>
                    <TableCell className="border text-center font-medium">{budget.budget_code}</TableCell>
                    <TableCell className="border">{budget.account_name}</TableCell>
                    <TableCell className="border text-right">{money(budget.allocated_amount)}</TableCell>
                    <TableCell className="border text-right">
                      {money(budget.remaining_amount)}
                      {isLow ? <div className="text-xs font-semibold text-amber-700">Recharge required</div> : null}
                    </TableCell>
                    <TableCell className="border text-right">{money(budget.used_amount)}</TableCell>
                    <TableCell className="border text-right">0.00</TableCell>
                    <TableCell className="border text-center capitalize">{budget.status}</TableCell>
                    {!showAggregate ? (
                      <TableCell className="border text-center">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openView(budget)} aria-label="View budget"><Eye className="h-4 w-4" /></Button>
                        {canManageBudget ? (
                          <>
                            <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(budget)} aria-label="Edit budget"><Edit className="h-4 w-4" /></Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => deleteBudget.mutate(budget.id)} aria-label="Delete budget"><Trash2 className="h-4 w-4" /></Button>
                          </>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
              {!budgets.length ? (
                <TableRow><TableCell colSpan={showAggregate ? 7 : 8} className="border py-8 text-center text-muted-foreground">No budget codes found for this fiscal year.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t p-3 text-sm md:flex-row md:items-center md:justify-between">
          <div className="text-muted-foreground">
            Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1} · Total {meta?.total ?? 0} records
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={(meta?.current_page ?? 1) <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
            <Button type="button" variant="outline" size="sm" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Budget" : "Create Budget"}</DialogTitle>
            <DialogDescription>One account code can exist under multiple BI Codes and fiscal years.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>BI Code</Label>
              <Input required value={form.bi_code} onChange={(event) => setForm((current) => ({ ...current, bi_code: event.target.value }))} />
            </div>
            <div>
              <Label>Fiscal Year</Label>
              <Input value={form.fiscal_year ?? ""} onChange={(event) => setForm((current) => ({ ...current, fiscal_year: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Reporting Unit</Label>
              <Input value={form.reporting_unit ?? ""} onChange={(event) => setForm((current) => ({ ...current, reporting_unit: event.target.value }))} />
            </div>
            <div>
              <Label>Bank Account Code</Label>
              <Input value={form.bank_account_code ?? ""} onChange={(event) => setForm((current) => ({ ...current, bank_account_code: event.target.value }))} />
            </div>
            <div>
              <Label>Source of Finance</Label>
              <Input value={form.source_of_finance ?? ""} onChange={(event) => setForm((current) => ({ ...current, source_of_finance: event.target.value }))} />
            </div>
            <div>
              <Label>Budget Type</Label>
              <Input value={form.budget_type ?? ""} onChange={(event) => setForm((current) => ({ ...current, budget_type: event.target.value }))} />
            </div>
            <div>
              <Label>Account Code</Label>
              <Input required value={form.budget_code} onChange={(event) => setForm((current) => ({ ...current, budget_code: event.target.value }))} placeholder="6111" />
            </div>
            <div>
              <Label>Account Description</Label>
              <Input required value={form.account_name} onChange={(event) => setForm((current) => ({ ...current, account_name: event.target.value }))} placeholder="Salaries to permanent staff" />
            </div>
            <div>
              <Label>Adjusted Budget</Label>
              <Input required type="number" min="0" step="0.01" value={form.allocated_amount} onChange={(event) => setForm((current) => ({ ...current, allocated_amount: event.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as "active" | "inactive" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description ?? ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional description" />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button disabled={isSubmitting} type="submit">{editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Budget Detail</DialogTitle>
            <DialogDescription>Transactions are shown for this account code and fiscal year.</DialogDescription>
          </DialogHeader>
          {selectedBudget.data ? (
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="bg-[#073763] px-4 py-2 text-center text-lg font-bold text-white">Report - Recurrent Expenditure</div>
                <div className="grid text-sm md:grid-cols-2">
                  <div className="border-b p-2 font-semibold md:border-r">BI Code: {selectedBudget.data.bi_code}</div>
                  <div className="border-b p-2 font-semibold">Fiscal Year: {selectedBudget.data.fiscal_year}</div>
                  <div className="border-b p-2 font-semibold md:border-r">Account Code: {selectedBudget.data.budget_code}</div>
                  <div className="border-b p-2 font-semibold">Source of Finance: {selectedBudget.data.source_of_finance}</div>
                  <div className="border-b p-2 font-semibold md:col-span-2">Account Description: {selectedBudget.data.account_name}</div>
                  <div className="border-b p-2 font-semibold md:border-r">Adjusted Budget: {money(selectedBudget.data.allocated_amount)}</div>
                  <div className="border-b p-2 font-semibold">Balance Not Committed: {money(selectedBudget.data.remaining_amount)}</div>
                </div>
              </div>

              {Number(selectedBudget.data.remaining_amount) < LOW_BUDGET_THRESHOLD ? (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Recharge required</AlertTitle>
                  <AlertDescription>This budget has less than 5,000 Birr remaining for fiscal year {selectedBudget.data.fiscal_year}.</AlertDescription>
                </Alert>
              ) : null}

              <div>
                <h3 className="mb-2 font-semibold">Transactions</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-200 hover:bg-gray-200">
                        <TableHead className="border text-black">Transaction No</TableHead>
                        <TableHead className="border text-black">Type</TableHead>
                        <TableHead className="border text-black">Payment</TableHead>
                        <TableHead className="border text-right text-black">Amount</TableHead>
                        <TableHead className="border text-right text-black">Before</TableHead>
                        <TableHead className="border text-right text-black">After</TableHead>
                        <TableHead className="border text-black">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(transactionsQuery.data?.data ?? selectedBudget.data.transactions ?? []).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="border">{transaction.transaction_no}</TableCell>
                          <TableCell className="border">{transaction.type}</TableCell>
                          <TableCell className="border">{transaction.payment?.payment_no ?? "-"}</TableCell>
                          <TableCell className="border text-right">{money(transaction.amount)}</TableCell>
                          <TableCell className="border text-right">{money(transaction.balance_before)}</TableCell>
                          <TableCell className="border text-right">{money(transaction.balance_after)}</TableCell>
                          <TableCell className="border">{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "-"}</TableCell>
                        </TableRow>
                      ))}
                      {!(transactionsQuery.data?.data ?? selectedBudget.data.transactions ?? []).length ? (
                        <TableRow><TableCell colSpan={7} className="border py-8 text-center text-muted-foreground">No transactions for this account code and fiscal year.</TableCell></TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
