"use client";

import Link from "next/link";
import { useMemo, type ElementType } from "react";
import {
  ArrowUpRight,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentRequests } from "@/hooks/payment/use-payment";
import type { PaymentRequest } from "@/types/payment/payment.type";

const moneyFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return `ETB ${moneyFormatter.format(asNumber(value))}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isCurrentMonth(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function approvedAmount(payment: PaymentRequest) {
  return asNumber(payment.amount);
}

function paidAmount(payment: PaymentRequest) {
  return asNumber(payment.paid_amount ?? payment.amount);
}

function paymentTypeName(payment: PaymentRequest) {
  if (payment.payment_type?.name) return payment.payment_type.name;
  return payment.request_type ?? "Payment";
}

function accountLabel(payment: PaymentRequest) {
  const code = payment.budget?.budget_code ?? payment.budget_code ?? "-";
  const name = payment.budget?.account_name;
  return name ? `${code} - ${name}` : code;
}

function biCode(payment: PaymentRequest) {
  return payment.budget?.bi_code ?? payment.office_code ?? "-";
}

function DashboardStat({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ElementType;
}) {
  return (
    <Card className="rounded-2xl border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceTable({ rows, emptyLabel }: { rows: PaymentRequest[]; emptyLabel: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment No</TableHead>
            <TableHead>Payee / Title</TableHead>
            <TableHead>Payment Type</TableHead>
            <TableHead>BI Code</TableHead>
            <TableHead>Account Code</TableHead>
            <TableHead className="text-right">Approved Amount</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.payment_no ?? `#${payment.id}`}</TableCell>
                <TableCell className="max-w-64 truncate">{payment.requesting_entity ?? payment.title}</TableCell>
                <TableCell>{paymentTypeName(payment)}</TableCell>
                <TableCell>{biCode(payment)}</TableCell>
                <TableCell className="max-w-56 truncate">{accountLabel(payment)}</TableCell>
                <TableCell className="text-right font-semibold">{money(approvedAmount(payment))}</TableCell>
                <TableCell>{formatDate(payment.paid_date ?? payment.completed_at)}</TableCell>
                <TableCell>
                  <Badge variant={payment.status === "payment_completed" ? "default" : "secondary"} className="capitalize">
                    {payment.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant={payment.status === "sent_to_finance" ? "default" : "outline"}>
                    <Link href={`/dashboard/payment/${payment.id}`}>
                      {payment.status === "sent_to_finance" ? "Mark Paid" : "View"}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-28 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RecentActivity({ rows }: { rows: PaymentRequest[] }) {
  return (
    <Card className="rounded-2xl border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">Recent Finance Activities</CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/payment">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? rows.slice(0, 6).map((payment) => (
          <Link
            key={payment.id}
            href={`/dashboard/payment/${payment.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 transition hover:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{payment.payment_no ?? `#${payment.id}`}</p>
              <p className="truncate text-xs text-muted-foreground">
                {paymentTypeName(payment)} · {money(paidAmount(payment))}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {payment.status.replaceAll("_", " ")}
            </Badge>
          </Link>
        )) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No recent finance activity.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FinanceAccountantDashboardPage() {
  const pendingQuery = usePaymentRequests({ status: "sent_to_finance", per_page: 100 });
  const paidQuery = usePaymentRequests({ status: "payment_completed", per_page: 100 });

  const pending = pendingQuery.data?.data ?? [];
  const paid = paidQuery.data?.data ?? [];
  const pendingTotal = pendingQuery.data?.meta.total ?? pending.length;
  const paidTotal = paidQuery.data?.meta.total ?? paid.length;

  const paidToday = useMemo(() => paid.filter((payment) => isToday(payment.paid_date ?? payment.completed_at)), [paid]);
  const paidThisMonth = useMemo(() => paid.filter((payment) => isCurrentMonth(payment.paid_date ?? payment.completed_at)), [paid]);
  const totalPaidAmount = useMemo(() => paid.reduce((sum, payment) => sum + paidAmount(payment), 0), [paid]);
  const perDiemExitPayments = useMemo(
    () => pending.filter((payment) => payment.per_diem || /per\s*diem/i.test(paymentTypeName(payment))),
    [pending],
  );

  const recentRows = [...pending.slice(0, 3), ...paid.slice(0, 3)];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 rounded-full">Finance Accountant Workspace</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Finance Payment Settlement Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Track all payments sent to finance, mark eligible payments as paid, and monitor your own paid payment history.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/payment">
              <CreditCard className="mr-2 h-4 w-4" /> Open Payments
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardStat title="Pending Finance" value={pendingTotal} subtitle="Visible to all accountants" icon={Clock3} />
        <DashboardStat title="Paid Today" value={paidToday.length} subtitle={money(paidToday.reduce((s, p) => s + paidAmount(p), 0))} icon={CalendarCheck} />
        <DashboardStat title="Paid This Month" value={paidThisMonth.length} subtitle={money(paidThisMonth.reduce((s, p) => s + paidAmount(p), 0))} icon={TrendingUp} />
        <DashboardStat title="My Paid Payments" value={paidTotal} subtitle="Only payments you marked paid" icon={CheckCircle2} />
        <DashboardStat title="Total Paid Amount" value={money(totalPaidAmount)} subtitle="Your paid payment total" icon={Banknote} />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Finance</TabsTrigger>
          <TabsTrigger value="paid">My Paid Payments</TabsTrigger>
          <TabsTrigger value="per-diem">Per Diem Exit</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base font-semibold">Pending Finance Payments</CardTitle>
                <p className="text-sm text-muted-foreground">Shared queue for all finance accountants.</p>
              </div>
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <FinanceTable rows={pending} emptyLabel="No payments are currently pending finance." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">My Paid Payments</CardTitle>
              <p className="text-sm text-muted-foreground">Only payments marked paid by your account are listed here.</p>
            </CardHeader>
            <CardContent>
              <FinanceTable rows={paid} emptyLabel="You have not marked any payments as paid yet." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="per-diem" className="space-y-4">
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Per Diem Exit Payments</CardTitle>
              <p className="text-sm text-muted-foreground">Per diem payments exited from Record Office and awaiting finance settlement.</p>
            </CardHeader>
            <CardContent>
              <FinanceTable rows={perDiemExitPayments} emptyLabel="No exited per diem payments are pending finance." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentActivity rows={recentRows} />
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-5 w-5" /> Finance Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Pending Finance is visible to every Finance Accountant.</p>
            <p>Paid Payments only shows records marked paid by the logged-in accountant.</p>
            <p>Finance Accountant cannot create payment requests and cannot print payment documents.</p>
            <p>Budget debit is posted when the payment is marked as paid.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
