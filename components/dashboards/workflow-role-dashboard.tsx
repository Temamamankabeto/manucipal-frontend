"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { ArrowUpRight, BarChart3, ClipboardList, CreditCard, FileText, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePaymentRequests } from "@/hooks/payment/use-payment";
import { useProcurementRequests } from "@/hooks/procurement/use-procurement";
import type { PaymentRequest } from "@/types/payment/payment.type";
import type { ProcurementRequest } from "@/types/procurement/procurement.type";

const moneyFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

function money(value: number) {
  return `ETB ${moneyFormatter.format(value)}`;
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "-").replaceAll("_", " ");
}

function statusCount<T extends { status?: string }>(rows: T[], statuses: string[]) {
  return rows.filter((row) => statuses.includes(String(row.status))).length;
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function paymentAmount(rows: PaymentRequest[]) {
  return rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
}

function procurementAmount(rows: ProcurementRequest[]) {
  return rows.reduce((sum, item) => {
    const itemTotal = item.items?.reduce(
      (subtotal, row) => subtotal + Number(row.estimated_total_cost ?? 0),
      0,
    );

    return sum + Number(itemTotal ?? 0);
  }, 0);
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
    <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
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

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <Progress value={percent(value, total)} className="h-2" />
    </div>
  );
}

function RecentWorkflowList({
  title,
  rows,
  type,
}: {
  title: string;
  rows: Array<PaymentRequest | ProcurementRequest>;
  type: "payment" | "procurement";
}) {
  return (
    <Card className="rounded-2xl border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/dashboard/${type}`}>
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? (
          rows.slice(0, 5).map((row) => {
            const number =
              type === "payment"
                ? (row as PaymentRequest).payment_no
                : (row as ProcurementRequest).request_no;

            return (
              <Link
                key={`${type}-${row.id}`}
                href={`/dashboard/${type}/${row.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 transition hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{number}</p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {normalizeStatus(row.status)}
                </Badge>
              </Link>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No workflow requests found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type WorkflowRoleDashboardProps = {
  roleName: string;
  title: string;
  subtitle: string;
  showPayment?: boolean;
  showProcurement?: boolean;
  canCreatePayment?: boolean;
  canCreateProcurement?: boolean;
};

export default function WorkflowRoleDashboard({
  roleName,
  title,
  subtitle,
  showPayment = true,
  showProcurement = true,
  canCreatePayment = false,
  canCreateProcurement = false,
}: WorkflowRoleDashboardProps) {
  const paymentsQuery = usePaymentRequests({ per_page: 100 });
  const procurementsQuery = useProcurementRequests({ per_page: 100 });

  const payments = showPayment ? paymentsQuery.data?.data ?? [] : [];
  const procurements = showProcurement ? procurementsQuery.data?.data ?? [] : [];

  const paymentActive = statusCount(payments, [
    "draft",
    "manager_review",
    "development_branch_review",
    "service_branch_review",
    "budget_review",
    "finance_review",
    "returned",
    "returned_by_manager",
    "returned_by_development_head",
    "returned_by_service_head",
    "returned_by_budget_tl",
    "returned_by_finance",
  ]);
  const procurementActive = statusCount(procurements, [
    "draft",
    "submitted",
    "manager_review",
    "development_branch_review",
    "service_branch_review",
    "budget_review",
    "returned",
  ]);
  const paymentCompleted = statusCount(payments, ["approved", "paid", "payment_completed"]);
  const procurementCompleted = statusCount(procurements, ["approved", "completed"]);

  const totalWorkflows = payments.length + procurements.length;
  const activeWorkflows = paymentActive + procurementActive;
  const completedWorkflows = paymentCompleted + procurementCompleted;
  const totalValue = paymentAmount(payments) + procurementAmount(procurements);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 rounded-full">{roleName}</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {showPayment && (
              <Button asChild>
                <Link href={canCreatePayment ? "/dashboard/payment/create" : "/dashboard/payment"}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {canCreatePayment ? "New Payment" : "Open Payments"}
                </Link>
              </Button>
            )}
            {showProcurement && (
              <Button asChild variant="outline">
                <Link href={canCreateProcurement ? "/dashboard/procurement/create" : "/dashboard/procurement"}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {canCreateProcurement ? "New Procurement" : "Open Procurements"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat title="Total requests" value={totalWorkflows} subtitle="Visible workflow requests" icon={ReceiptText} />
        <DashboardStat title="Active requests" value={activeWorkflows} subtitle="Pending or returned" icon={FileText} />
        <DashboardStat title="Completed" value={completedWorkflows} subtitle="Approved, paid, or completed" icon={BarChart3} />
        <DashboardStat title="Financial value" value={money(totalValue)} subtitle="Payment + procurement value" icon={CreditCard} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {showPayment && (
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <StatusBar label="Active" value={paymentActive} total={payments.length} />
              <StatusBar label="Completed" value={paymentCompleted} total={payments.length} />
              <StatusBar label="Returned" value={statusCount(payments, ["returned", "returned_by_manager", "returned_by_development_head", "returned_by_service_head", "returned_by_budget_tl", "returned_by_finance"])} total={payments.length} />
              <StatusBar label="Rejected" value={statusCount(payments, ["rejected"])} total={payments.length} />
            </CardContent>
          </Card>
        )}
        {showProcurement && (
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader><CardTitle className="text-base">Procurement Status</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <StatusBar label="Active" value={procurementActive} total={procurements.length} />
              <StatusBar label="Completed" value={procurementCompleted} total={procurements.length} />
              <StatusBar label="Returned" value={statusCount(procurements, ["returned"])} total={procurements.length} />
              <StatusBar label="Rejected" value={statusCount(procurements, ["rejected"])} total={procurements.length} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {showPayment && <RecentWorkflowList title="Recent Payments" rows={payments} type="payment" />}
        {showProcurement && <RecentWorkflowList title="Recent Procurements" rows={procurements} type="procurement" />}
      </div>
    </div>
  );
}
