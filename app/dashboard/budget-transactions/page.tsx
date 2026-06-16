"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBudgetTransactions } from "@/hooks/budget/use-budget";

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BudgetTransactionsPage() {
  const [type, setType] = useState("all");
  const [fiscalYear, setFiscalYear] = useState("all");
  const [page, setPage] = useState(1);
  const transactionsQuery = useBudgetTransactions({ type, fiscal_year: fiscalYear, page, per_page: 10 });
  const transactions = transactionsQuery.data?.data ?? [];
  const meta = transactionsQuery.data?.meta;
  const lastPage = meta?.last_page ?? 1;

  useEffect(() => {
    setPage(1);
  }, [type, fiscalYear]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budget Transactions</h1>
        <p className="text-sm text-muted-foreground">Audit trail for budget deductions, reversals, and adjustments by fiscal year.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEBIT">Debit</SelectItem>
                <SelectItem value="REVERSAL">Reversal</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Input value={fiscalYear === "all" ? "" : fiscalYear} onChange={(event) => setFiscalYear(event.target.value || "all")} placeholder="Fiscal year, e.g. 2018" />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction No</TableHead>
                  <TableHead>Budget Code</TableHead>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.transaction_no}</TableCell>
                    <TableCell>{transaction.budget?.budget_code} - {transaction.budget?.account_name}</TableCell>
                    <TableCell>{transaction.budget?.fiscal_year ?? "-"}</TableCell>
                    <TableCell>{transaction.payment?.payment_no ?? "-"}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{money(transaction.amount)}</TableCell>
                    <TableCell>{money(transaction.balance_before)}</TableCell>
                    <TableCell>{money(transaction.balance_after)}</TableCell>
                    <TableCell>{transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}</TableCell>
                  </TableRow>
                ))}
                {!transactions.length && <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No budget transactions found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">Page {meta?.current_page ?? page} of {lastPage} • Total {meta?.total ?? 0}</p>
            <Pagination className="md:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((current) => Math.max(1, current - 1));
                    }}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((current) => Math.min(lastPage, current + 1));
                    }}
                    aria-disabled={page >= lastPage}
                    className={page >= lastPage ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
