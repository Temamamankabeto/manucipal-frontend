"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Timer,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProcurementPaymentSummary } from "@/hooks/reports/use-procurement-payment-report";
import { authService } from "@/services/auth/auth.service";

type StatusRow = { status: string; total: number };
type ReportScope = "payment" | "procurement";

const fullReportRoles = new Set([
  "planning-budget-team-leader",
  "planning-and-budget-team-leader",
]);

const viewOnlyRoles = new Set([
  "manager",
  "head-of-development-branch",
  "head-development-branch",
  "head-of-service-branch",
  "head-service-branch",
]);

export default function ProcurementPaymentReportsPage() {
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type") ?? searchParams.get("tab");
  const defaultTab: ReportScope = queryType === "procurement" ? "procurement" : "payment";
  const { data, isLoading } = useProcurementPaymentSummary();

  const user = authService.getStoredUser();
  const role = authService.getStoredRoles()[0] ?? user?.role ?? "";
  const normalizedRole = normalizeRole(role);
  const isFullReportUser = fullReportRoles.has(normalizedRole);
  const isViewOnlyUser = viewOnlyRoles.has(normalizedRole) || !isFullReportUser;

  const paymentRows = data?.payment.by_status ?? [];
  const procurementRows = data?.procurement.by_status ?? [];
  const paymentMax = useMemo(() => maxTotal(paymentRows), [paymentRows]);
  const procurementMax = useMemo(() => maxTotal(procurementRows), [procurementRows]);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              {isFullReportUser ? "Planning & Budget Report Center" : "View Only Report Center"}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Payment & Procurement Reports</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Clean role-based reporting for payment and procurement workflows. Planning & Budget Team Leader can access the full report center; Manager and Branch Heads have view-only access.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            <p className="font-semibold">Current Role</p>
            <p className="text-muted-foreground">{role || "User"}</p>
            {isViewOnlyUser ? <Badge className="mt-2" variant="secondary">View only</Badge> : null}
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[420px]">
          <TabsTrigger value="payment">Payment Report</TabsTrigger>
          <TabsTrigger value="procurement">Procurement Report</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          <PaymentReportSection rows={paymentRows} max={paymentMax} data={data} isFullReportUser={isFullReportUser} />
        </TabsContent>

        <TabsContent value="procurement" className="space-y-6">
          <ProcurementReportSection rows={procurementRows} max={procurementMax} data={data} isFullReportUser={isFullReportUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentReportSection({
  rows,
  max,
  data,
  isFullReportUser,
}: {
  rows: StatusRow[];
  max: number;
  data: any;
  isFullReportUser: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Payments" value={data?.payment.total ?? 0} icon={CreditCard} description="All payment requests" />
        <KpiCard title="Pending Payments" value={data?.payment.pending ?? 0} icon={Timer} description="Waiting for action" />
        <KpiCard title="Approved / Completed" value={data?.payment.completed ?? 0} icon={ShieldCheck} description="Completed workflow" />
        <KpiCard title="Total Amount" value={money(data?.payment.total_amount ?? 0)} icon={TrendingUp} description="Requested amount" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StatusChart title="Payment Status Report" rows={rows} max={max} />
        </div>
        <ReportTable
          title="Payment Reports"
          rows={[
            ["Summary", "Total, pending, completed, returned and amount totals."],
            ["Status", "Draft, review, records processing, sent to finance and paid."],
            ["Returned", "Returned payment count and correction tracking."],
            ["Finance", "Sent to finance, paid and unpaid payment visibility."],
            ...(isFullReportUser ? [["Budget Control", "Budget code, BI code and utilization visibility."] as [string, string]] : []),
          ]}
        />
      </div>
    </div>
  );
}

function ProcurementReportSection({
  rows,
  max,
  data,
  isFullReportUser,
}: {
  rows: StatusRow[];
  max: number;
  data: any;
  isFullReportUser: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Procurements" value={data?.procurement.total ?? 0} icon={ClipboardList} description="All procurement requests" />
        <KpiCard title="Pending Procurements" value={data?.procurement.pending ?? 0} icon={Timer} description="Waiting for action" />
        <KpiCard title="Approved / Completed" value={data?.procurement.completed ?? 0} icon={ShieldCheck} description="Completed workflow" />
        <KpiCard title="Returned / Rejected" value={data?.procurement.rejected ?? 0} icon={RefreshCcw} description="Needs correction" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StatusChart title="Procurement Status Report" rows={rows} max={max} />
        </div>
        <ReportTable
          title="Procurement Reports"
          rows={[
            ["Summary", "Total, pending, completed and returned procurements."],
            ["Status", "Draft, review, records processing and completed status."],
            ["Category", "Fixed Asset, Machinery and Operational procurement."],
            ["Returned", "Returned procurement count and correction tracking."],
            ...(isFullReportUser ? [["Technical Routing", "Asset Team Leader and Machinery Team Leader routing visibility."] as [string, string]] : []),
          ]}
        />
      </div>
    </div>
  );
}

function KpiCard({ title, value, description, icon: Icon }: { title: string; value: string | number; description: string; icon: typeof BarChart3 }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusChart({ title, rows, max }: { title: string; rows: StatusRow[]; max: number }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Workflow status count and distribution.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length ? rows.map((row) => {
          const percentage = max > 0 ? Math.max(8, Math.round((row.total / max) * 100)) : 0;
          return (
            <div key={row.status} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium capitalize">{formatStatus(row.status)}</span>
                <Badge variant="secondary">{row.total}</Badge>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        }) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No status data available.</div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{title}</CardTitle>
        <CardDescription>Focused reports only. Unnecessary role lists and catalogue cards were removed.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([name, purpose]) => (
              <TableRow key={name}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{purpose}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function normalizeRole(role?: string | null) {
  return String(role ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replaceAll("-", " ");
}

function maxTotal(rows: StatusRow[]) {
  return rows.reduce((max, row) => Math.max(max, Number(row.total) || 0), 0);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}
