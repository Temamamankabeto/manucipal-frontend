"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  Archive,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  PackageCheck,
  ReceiptText,
  Send,
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
          rows.slice(0, 6).map((row) => {
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
            No record office workflow requests found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RecordsOfficeDashboardPage() {
  const paymentsQuery = usePaymentRequests({ per_page: 100 });
  const procurementsQuery = useProcurementRequests({ per_page: 100 });

  const payments = paymentsQuery.data?.data ?? [];
  const procurements = procurementsQuery.data?.data ?? [];

  const pendingRecordPayments = payments.filter((row) => row.status === "records_processing");
  const sentFinancePayments = payments.filter((row) => row.status === "sent_to_finance");
  const completedPayments = payments.filter((row) => ["payment_completed", "paid"].includes(row.status));

  const pendingRecordProcurements = procurements.filter((row) => row.status === "records_processing");
  const completedProcurements = procurements.filter((row) => ["completed", "approved"].includes(String(row.status)));

  const totalRecordQueue = pendingRecordPayments.length + pendingRecordProcurements.length;
  const totalRegistered = sentFinancePayments.length + completedPayments.length + completedProcurements.length;
  const totalWorkflows = payments.length + procurements.length;
  const recordCompletionRate = percent(totalRegistered, totalWorkflows);

  const paymentStatusRows = [
    { label: "Pending record processing", value: pendingRecordPayments.length },
    { label: "Sent to finance", value: sentFinancePayments.length },
    { label: "Paid / completed", value: completedPayments.length },
    { label: "Returned / rejected", value: statusCount(payments, ["returned", "rejected"]) },
  ];

  const procurementStatusRows = [
    { label: "Pending record processing", value: pendingRecordProcurements.length },
    { label: "Completed", value: completedProcurements.length },
    { label: "Returned / rejected", value: statusCount(procurements, ["returned", "rejected"]) },
    { label: "Draft", value: statusCount(procurements, ["draft"]) },
  ];

  const recordValue = paymentAmount(sentFinancePayments) + paymentAmount(completedPayments) + procurementAmount(completedProcurements);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 rounded-full">Record Office Workspace</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Record Registration & Dispatch Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Track payment records, procurement records, document registration, finance dispatch, and completed archive activities.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/payment">
                <CreditCard className="mr-2 h-4 w-4" /> Payment Records
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/procurement">
                <ClipboardList className="mr-2 h-4 w-4" /> Procurement Records
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          title="Pending record queue"
          value={totalRecordQueue}
          subtitle="Payments and procurements awaiting record action"
          icon={Clock3}
        />
        <DashboardStat
          title="Payments to finance"
          value={sentFinancePayments.length}
          subtitle="Registered and dispatched payment files"
          icon={Send}
        />
        <DashboardStat
          title="Registered files"
          value={totalRegistered}
          subtitle="Finance-dispatched and completed records"
          icon={Archive}
        />
        <DashboardStat
          title="Registered value"
          value={formatMoney(recordValue)}
          subtitle="Total value controlled by record office"
          icon={ReceiptText}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" /> Record office performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Registration rate</p>
                <p className="mt-2 text-3xl font-bold">{recordCompletionRate}%</p>
                <Progress value={recordCompletionRate} className="mt-4 h-2" />
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Payment dispatch rate</p>
                <p className="mt-2 text-3xl font-bold">{percent(sentFinancePayments.length, payments.length)}%</p>
                <Progress value={percent(sentFinancePayments.length, payments.length)} className="mt-4 h-2" />
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Active queue</p>
                <p className="mt-2 text-3xl font-bold">{totalRecordQueue}</p>
                <p className="mt-4 text-xs text-muted-foreground">Requests currently assigned to record office.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" /> Payment record status
                </div>
                {paymentStatusRows.map((row) => (
                  <StatusBar key={row.label} label={row.label} value={row.value} total={payments.length} />
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                  <PackageCheck className="h-4 w-4 text-primary" /> Procurement record status
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
              <FileCheck2 className="h-5 w-5 text-primary" /> Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/payment?status=records_processing">
                <FileText className="mr-2 h-4 w-4" /> Process payment records
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/payment?status=sent_to_finance">
                <Send className="mr-2 h-4 w-4" /> View sent-to-finance payments
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/procurement?status=records_processing">
                <ClipboardList className="mr-2 h-4 w-4" /> Process procurement records
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/reports/procurement-payment">
                <BarChart3 className="mr-2 h-4 w-4" /> Open record reports
              </Link>
            </Button>
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Record control protected
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                This dashboard reads only workflow data permitted by backend role access and keeps payment/procurement workflows unchanged.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentWorkflowList title="Payment records needing attention" rows={pendingRecordPayments} type="payment" />
        <RecentWorkflowList title="Procurement records needing attention" rows={pendingRecordProcurements} type="procurement" />
      </div>
    </div>
  );
}
