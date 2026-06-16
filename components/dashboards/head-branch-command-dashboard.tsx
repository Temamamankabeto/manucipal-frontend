"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  PackageCheck,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePaymentRequests } from "@/hooks/payment/use-payment";
import { useProcurementRequests } from "@/hooks/procurement/use-procurement";
import type { PaymentRequest } from "@/types/payment/payment.type";
import type { ProcurementRequest } from "@/types/procurement/procurement.type";

const moneyFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return `ETB ${moneyFormatter.format(value)}`;
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "-").replaceAll("_", " ");
}

function statusCount<T extends { status?: string }>(rows: T[], statuses: string[]) {
  return rows.filter((row) => statuses.includes(String(row.status))).length;
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function paymentAmount(rows: PaymentRequest[]) {
  return rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
}

function procurementAmount(rows: ProcurementRequest[]) {
  return rows.reduce((sum, item) => {
    const itemsTotal = item.items?.reduce(
      (itemSum, row) => itemSum + Number(row.estimated_total_cost ?? 0),
      0,
    );

    return sum + Number(itemsTotal ?? 0);
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
            const isPayment = type === "payment";
            const number = isPayment
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

type HeadBranchCommandDashboardProps = {
  roleName: "Head of Development Branch" | "Head of Service Branch";
  title: string;
  subtitle: string;
};

export default function HeadBranchCommandDashboard({
  roleName,
  title,
  subtitle,
}: HeadBranchCommandDashboardProps) {
  const paymentsQuery = usePaymentRequests({ per_page: 100 });
  const procurementsQuery = useProcurementRequests({ per_page: 100 });

  const payments = paymentsQuery.data?.data ?? [];
  const procurements = procurementsQuery.data?.data ?? [];

  const paymentPending = statusCount(payments, [
    "manager_review",
    "development_branch_review",
    "service_branch_review",
    "budget_tl_review",
    "budget_expert_processing",
    "budget_tl_final_review",
    "manager_final_review",
    "records_processing",
    "sent_to_finance",
  ]);
  const paymentCompleted = statusCount(payments, ["paid", "payment_completed"]);
  const procurementPending = statusCount(procurements, [
    "submitted",
    "manager_review",
    "development_branch_review",
    "service_branch_review",
    "asset_team_review",
    "machinery_team_review",
    "budget_tl_review",
    "budget_expert_processing",
    "final_manager_review",
    "records_processing",
  ]);
  const procurementCompleted = statusCount(procurements, ["completed"]);

  const totalWorkflows = payments.length + procurements.length;
  const completedWorkflows = paymentCompleted + procurementCompleted;
  const pendingWorkflows = paymentPending + procurementPending;
  const totalFinancialValue = paymentAmount(payments) + procurementAmount(procurements);

  const paymentStatusRows = [
    { label: "Pending", value: paymentPending },
    { label: "Completed", value: paymentCompleted },
    { label: "Returned", value: statusCount(payments, ["returned", "returned_by_manager", "returned_by_development_head", "returned_by_service_head", "returned_by_budget_tl", "returned_by_finance"]) },
    { label: "Rejected", value: statusCount(payments, ["rejected"]) },
  ];

  const procurementStatusRows = [
    { label: "Pending", value: procurementPending },
    { label: "Completed", value: procurementCompleted },
    { label: "Returned", value: statusCount(procurements, ["returned"]) },
    { label: "Rejected", value: statusCount(procurements, ["rejected"]) },
  ];

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
            <Button asChild>
              <Link href="/dashboard/payment/create">
                <CreditCard className="mr-2 h-4 w-4" /> New Payment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/payment">
                <FileText className="mr-2 h-4 w-4" /> Review Payments
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/procurement">
                <ShoppingCart className="mr-2 h-4 w-4" /> Review Procurements
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          title="Total workflow requests"
          value={totalWorkflows}
          subtitle={`${pendingWorkflows} active requests need follow-up`}
          icon={ReceiptText}
        />
        <DashboardStat
          title="Payment requests"
          value={payments.length}
          subtitle={`${paymentCompleted} completed payments`}
          icon={CreditCard}
        />
        <DashboardStat
          title="Procurement requests"
          value={procurements.length}
          subtitle={`${procurementCompleted} completed procurements`}
          icon={PackageCheck}
        />
        <DashboardStat
          title="Financial value"
          value={formatMoney(totalFinancialValue)}
          subtitle="Payments + procurement estimates"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" /> Workflow performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Completion rate</p>
                <p className="mt-2 text-3xl font-bold">{percent(completedWorkflows, totalWorkflows)}%</p>
                <Progress value={percent(completedWorkflows, totalWorkflows)} className="mt-4 h-2" />
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Pending rate</p>
                <p className="mt-2 text-3xl font-bold">{percent(pendingWorkflows, totalWorkflows)}%</p>
                <Progress value={percent(pendingWorkflows, totalWorkflows)} className="mt-4 h-2" />
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Financial value</p>
                <p className="mt-2 text-2xl font-bold">{formatMoney(totalFinancialValue)}</p>
                <p className="mt-4 text-xs text-muted-foreground">Payments + procurement estimates</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" /> Payment status
                </div>
                {paymentStatusRows.map((row) => (
                  <StatusBar key={row.label} label={row.label} value={row.value} total={payments.length} />
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShoppingCart className="h-4 w-4 text-primary" /> Procurement status
                </div>
                {procurementStatusRows.map((row) => (
                  <StatusBar key={row.label} label={row.label} value={row.value} total={procurements.length} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock3 className="h-5 w-5 text-primary" /> Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/payment">
                <CreditCard className="mr-2 h-4 w-4" /> Review payments
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/procurement">
                <ShoppingCart className="mr-2 h-4 w-4" /> Review procurements
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/reports/procurement-payment">
                <FileText className="mr-2 h-4 w-4" /> Open reports
              </Link>
            </Button>
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Role scope protected
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                This dashboard shows only records available to {roleName.toLowerCase()} by backend RBAC and workflow rules.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentWorkflowList title="Recent payment workflows" rows={payments} type="payment" />
        <RecentWorkflowList title="Recent procurement workflows" rows={procurements} type="procurement" />
      </div>
    </div>
  );
}
