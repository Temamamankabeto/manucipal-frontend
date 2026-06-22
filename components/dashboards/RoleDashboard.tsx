"use client";

import Link from "next/link";
import { useMemo, useState, type ElementType } from "react";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  Loader2,
  PackageCheck,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleDashboard } from "@/hooks/dashboard/use-role-dashboard";
import { useTranslation } from "react-i18next";
import type {
  DashboardTab,
  RoleDashboardFilters,
  RoleDashboardScope,
} from "@/types/dashboard/role-dashboard.type";

type Props = { scope: RoleDashboardScope; showBudget?: boolean };
type ChartRow = {
  label?: string | null;
  name?: string | null;
  value: number | string;
};
type KpiDefinition = {
  title: string;
  value: string | number;
  description: string;
  icon: ElementType;
  href?: string;
};

type RoleContentConfig = {
  title: string;
  subtitle: string;
  badge: string;
  paymentTableTitle: string;
  procurementTableTitle: string;
  overviewTables: string[];
  chartTitles: string[];
};

const roleContent: Record<RoleDashboardScope, RoleContentConfig> = {
  super_admin: {
    title: "Super Admin Dashboard",
    subtitle:
      "System administration summary for users, offices, departments, payment, procurement, and workflow activity.",
    badge: "Administration",
    paymentTableTitle: "Recent Payments",
    procurementTableTitle: "Recent Procurements",
    overviewTables: [
      "Recent User Activities",
      "Audit Logs",
      "Payment Categories",
      "Procurement Types",
    ],
    chartTitles: [
      "Payment Status Distribution",
      "Procurement Status Distribution",
      "Monthly Transactions",
    ],
  },
  manager: {
    title: "Manager Dashboard",
    subtitle:
      "Approval command center for pending approvals, approved requests, workload, and budget visibility.",
    badge: "Approval",
    paymentTableTitle: "Pending Payments",
    procurementTableTitle: "Pending Procurements",
    overviewTables: [
      "Recently Approved Payments",
      "Recently Approved Procurements",
    ],
    chartTitles: [
      "Payment Status",
      "Procurement Status",
      "Approval Trends",
      "Budget Utilization",
    ],
  },
  head_of_development_branch: {
    title: "Head of Development Branch Dashboard",
    subtitle:
      "Branch review dashboard for payments, procurements, returned requests, and monthly approvals.",
    badge: "Development Branch",
    paymentTableTitle: "Payments Awaiting Review",
    procurementTableTitle: "Procurements Awaiting Review",
    overviewTables: ["Recently Approved Requests"],
    chartTitles: [
      "Approval Trends",
      "Monthly Approved Amount",
      "Budget Utilization",
    ],
  },
  head_of_service_branch: {
    title: "Head of Service Branch Dashboard",
    subtitle:
      "Service branch review dashboard for payments, procurements, returned requests, and monthly approvals.",
    badge: "Service Branch",
    paymentTableTitle: "Payments Awaiting Review",
    procurementTableTitle: "Procurements Awaiting Review",
    overviewTables: ["Recently Approved Requests"],
    chartTitles: [
      "Approval Trends",
      "Monthly Approved Amount",
      "Budget Utilization",
    ],
  },
  team_leader: {
    title: "Team Leader Dashboard",
    subtitle:
      "Team queue for budget reviews, expert assignment, approvals, and open workload tracking.",
    badge: "Team Queue",
    paymentTableTitle: "Pending Payments",
    procurementTableTitle: "Pending Procurements",
    overviewTables: ["Assigned Experts", "Pending Expert Assignments"],
    chartTitles: ["Monthly Approvals"],
  },
  expert: {
    title: "Expert Dashboard",
    subtitle:
      "Assigned work dashboard for pending reviews, completed reviews, payments, and procurements.",
    badge: "Expert Workbench",
    paymentTableTitle: "Assigned Payments",
    procurementTableTitle: "Assigned Procurements",
    overviewTables: ["Completed Requests"],
    chartTitles: ["Assigned vs Completed"],
  },
  record_officer: {
    title: "Record Officer Dashboard",
    subtitle:
      "Record processing dashboard for remaining print, exit print, sent to finance, and completed records.",
    badge: "Records",
    paymentTableTitle: "Payments Ready For Records",
    procurementTableTitle: "Procurements Ready For Records",
    overviewTables: ["Sent To Finance List"],
    chartTitles: ["Records Processing Trend", "Exit Processing Trend"],
  },
  accountant: {
    title: "Accountant Dashboard",
    subtitle:
      "Finance dashboard for pending finance payments, paid payments, paid amount, and finance history.",
    badge: "Finance",
    paymentTableTitle: "Pending Finance Payments",
    procurementTableTitle: "Finance Procurement Reference",
    overviewTables: ["Paid Payments", "Finance History"],
    chartTitles: [
      "Paid By Category",
      "Monthly Payment Trend",
      "Paid By Payment Type",
    ],
  },
  secretory: {
    title: "Secretory Dashboard",
    subtitle:
      "Requester dashboard for own payment requests, procurement requests, pending, approved, and returned work.",
    badge: "Requester",
    paymentTableTitle: "My Payments",
    procurementTableTitle: "My Procurements",
    overviewTables: ["Returned Requests"],
    chartTitles: ["My Requests Status", "Monthly Requests"],
  },
};

const budgetVisibleScopes = new Set<RoleDashboardScope>([
  "manager",
  "head_of_development_branch",
  "head_of_service_branch",
  "team_leader",
  "expert",
]);

const paymentOnlyScopes = new Set<RoleDashboardScope>(["accountant"]);

const moneyFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function translationKey(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function useDbTranslation() {
  const { t, i18n } = useTranslation();

  return (value?: string | null) => {
    const text = String(value ?? "");
    const key = translationKey(text);

    if (!key) return text;

    // Touch the active language so React re-renders all dashboard labels
    // immediately after the database-driven language switch.
    void i18n.language;

    const translated = t(key);
    return translated && translated !== key ? translated : text;
  };
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: unknown) {
  return `ETB ${moneyFormatter.format(toNumber(value))}`;
}

function compactMoney(value: unknown) {
  const amount = toNumber(value);
  if (amount >= 1_000_000_000)
    return `ETB ${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `ETB ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `ETB ${(amount / 1_000).toFixed(1)}K`;
  return money(amount);
}

function date(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function statusLabel(value?: string | null) {
  return String(value ?? "-").replaceAll("_", " ");
}

function normalize(value?: string | null) {
  return String(value ?? "").toLowerCase();
}

function isPendingStatus(status?: string | null) {
  const value = normalize(status);
  return (
    Boolean(value) &&
    !value.includes("paid") &&
    !value.includes("completed") &&
    !value.includes("approved") &&
    !value.includes("reject") &&
    !value.includes("cancel")
  );
}

function isApprovedStatus(status?: string | null) {
  const value = normalize(status);
  return (
    value.includes("approved") ||
    value.includes("completed") ||
    value.includes("sent_to_finance") ||
    value.includes("paid")
  );
}

function isReturnedStatus(status?: string | null) {
  const value = normalize(status);
  return value.includes("return") || value.includes("reject");
}

function statusTone(status?: string | null) {
  const value = normalize(status);
  if (
    value.includes("paid") ||
    value.includes("completed") ||
    value.includes("approved")
  )
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (
    value.includes("reject") ||
    value.includes("return") ||
    value.includes("cancel")
  )
    return "border-red-200 bg-red-50 text-red-700";
  if (value.includes("draft"))
    return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function chartLabel(row: ChartRow) {
  return row.label ?? row.name ?? "-";
}

function chartValue(row: ChartRow) {
  return toNumber(row.value);
}

function updateFilter(
  setFilters: (value: RoleDashboardFilters) => void,
  filters: RoleDashboardFilters,
  key: keyof RoleDashboardFilters,
  value: string,
) {
  setFilters({ ...filters, [key]: value === "all" ? "" : value });
}

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: KpiDefinition) {
  const tt = useDbTranslation();
  const content = (
    <Card className="group min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="relative p-5">
        <div className="absolute right-4 top-4 rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="pr-14 text-sm font-medium text-muted-foreground">
          {tt(title)}
        </p>
        <p className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
          {value}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{tt(description)}</p>
        {href ? (
          <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
        ) : null}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function DonutChart({
  title,
  rows = [],
  amount = false,
}: {
  title: string;
  rows?: ChartRow[];
  amount?: boolean;
}) {
  const tt = useDbTranslation();
  const sorted = [...rows]
    .sort((a, b) => chartValue(b) - chartValue(a))
    .slice(0, 5);
  const total = sorted.reduce((sum, row) => sum + chartValue(row), 0);

  return (
    <Card className="min-w-0 rounded-2xl border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            {tt(title)}
          </span>
          <Badge variant="secondary">{tt("Top")} {sorted.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-primary/20 bg-primary/5 text-center">
          <div>
            <p className="text-xs text-muted-foreground">{tt("Total")}</p>
            <p className="text-lg font-bold">
              {amount ? compactMoney(total) : total}
            </p>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          {sorted.length ? (
            sorted.map((row, index) => {
              const percent = total
                ? Math.round((chartValue(row) / total) * 100)
                : 0;
              return (
                <div
                  key={`${title}-${chartLabel(row)}-${index}`}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {tt(chartLabel(row))}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {amount ? compactMoney(chartValue(row)) : chartValue(row)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tt("No chart data available.")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartCard({
  title,
  rows = [],
  amount = false,
}: {
  title: string;
  rows?: ChartRow[];
  amount?: boolean;
}) {
  const tt = useDbTranslation();
  const sorted = [...rows]
    .sort((a, b) => chartValue(b) - chartValue(a))
    .slice(0, 7);
  const max = Math.max(...sorted.map(chartValue), 1);

  return (
    <Card className="min-w-0 rounded-2xl border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" />
          {tt(title)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length ? (
          sorted.map((row, index) => {
            const width = Math.max(
              6,
              Math.round((chartValue(row) / max) * 100),
            );
            return (
              <div
                key={`${title}-${chartLabel(row)}-${index}`}
                className="space-y-1"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">
                    {tt(chartLabel(row))}
                  </span>
                  <span className="text-muted-foreground">
                    {amount ? compactMoney(chartValue(row)) : chartValue(row)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {tt("No chart data available.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FilterBar({
  tab,
  filters,
  setFilters,
}: {
  tab: DashboardTab;
  filters: RoleDashboardFilters;
  setFilters: (value: RoleDashboardFilters) => void;
}) {
  const tt = useDbTranslation();

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={tt("Fiscal year")}
          value={filters.fiscal_year ?? ""}
          onChange={(event) =>
            updateFilter(setFilters, filters, "fiscal_year", event.target.value)
          }
        />
      </div>
      {tab !== "budget" ? (
        <>
          <Input
            placeholder={tt(
              tab === "payment" ? "Payment category" : "Procurement category",
            )}
            value={filters.category ?? ""}
            onChange={(event) =>
              updateFilter(setFilters, filters, "category", event.target.value)
            }
          />
          <Input
            placeholder={tt(
              tab === "payment" ? "Payment type" : "Procurement type",
            )}
            value={filters.type ?? ""}
            onChange={(event) =>
              updateFilter(setFilters, filters, "type", event.target.value)
            }
          />
          <Select
            value={filters.date_preset || "all"}
            onValueChange={(value) =>
              updateFilter(setFilters, filters, "date_preset", value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={tt("Date")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tt("All Dates")}</SelectItem>
              <SelectItem value="this_week">{tt("This Week")}</SelectItem>
              <SelectItem value="this_month">{tt("This Month")}</SelectItem>
              <SelectItem value="custom">{tt("Custom")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.date_from ?? ""}
            onChange={(event) =>
              updateFilter(setFilters, filters, "date_from", event.target.value)
            }
          />
          <Input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(event) =>
              updateFilter(setFilters, filters, "date_to", event.target.value)
            }
          />
        </>
      ) : (
        <>
          <Input
            placeholder={tt("Office / BI code")}
            value={filters.bi_code ?? ""}
            onChange={(event) =>
              updateFilter(setFilters, filters, "bi_code", event.target.value)
            }
          />
          <Input
            placeholder={tt("Department / Account code")}
            value={filters.account_code ?? ""}
            onChange={(event) =>
              updateFilter(
                setFilters,
                filters,
                "account_code",
                event.target.value,
              )
            }
          />
        </>
      )}
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          updateFilter(setFilters, filters, "status", value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={tt("Status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tt("All Status")}</SelectItem>
          <SelectItem value="draft">{tt("Draft")}</SelectItem>
          <SelectItem value="manager_review">{tt("Manager Review")}</SelectItem>
          <SelectItem value="budget_tl_review">
            {tt("Team Leader Review")}
          </SelectItem>
          <SelectItem value="budget_expert_processing">
            {tt("Expert Processing")}
          </SelectItem>
          <SelectItem value="manager_final_review">
            {tt("Final Approval")}
          </SelectItem>
          <SelectItem value="records_processing">
            {tt("Record Office")}
          </SelectItem>
          <SelectItem value="sent_to_finance">
            {tt("Sent to Finance")}
          </SelectItem>
          <SelectItem value="paid">{tt("Paid")}</SelectItem>
          <SelectItem value="active">{tt("Active")}</SelectItem>
          <SelectItem value="inactive">{tt("Inactive")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SmallSummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  const tt = useDbTranslation();

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{tt(title)}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{tt(description)}</p>
    </div>
  );
}

function EmptyScope({ message }: { message: string }) {
  const tt = useDbTranslation();

  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        {tt(message)}
      </CardContent>
    </Card>
  );
}

export default function RoleDashboard({ scope, showBudget = true }: Props) {
  const tt = useDbTranslation();
  const { i18n } = useTranslation();
  const canViewBudget = showBudget && budgetVisibleScopes.has(scope);
  const [tab, setTab] = useState<DashboardTab>(
    canViewBudget ? "budget" : "payment",
  );
  const [filters, setFilters] = useState<RoleDashboardFilters>({});
  const { data, isLoading, isFetching, refetch } = useRoleDashboard(
    scope,
    tab,
    filters,
  );

  const config = roleContent[scope];
  const dashboard = data?.data ?? {
    payments: [],
    procurements: [],
    budgets: [],
    charts: {},
  };
  const canViewPayment = scope !== "super_admin" || true;
  const canViewProcurement = !paymentOnlyScopes.has(scope);

  const totals = useMemo(() => {
    const approvedPayment = dashboard.payments.reduce(
      (sum, row) => sum + toNumber(row.approved_amount),
      0,
    );
    const paidPayment = dashboard.payments.reduce(
      (sum, row) => sum + toNumber(row.paid_amount),
      0,
    );
    const procurementAmount = dashboard.procurements.reduce(
      (sum, row) => sum + toNumber(row.amount),
      0,
    );
    const adjustedBudget = dashboard.budgets.reduce(
      (sum, row) => sum + toNumber(row.adjusted_budget),
      0,
    );
    const budgetBalance = dashboard.budgets.reduce(
      (sum, row) => sum + toNumber(row.balance_not_committed),
      0,
    );
    const debit = dashboard.budgets.reduce(
      (sum, row) => sum + toNumber(row.debit),
      0,
    );
    const paymentPending = dashboard.payments.filter((row) =>
      isPendingStatus(row.status),
    ).length;
    const procurementPending = dashboard.procurements.filter((row) =>
      isPendingStatus(row.status),
    ).length;
    const approvedPayments = dashboard.payments.filter((row) =>
      isApprovedStatus(row.status),
    ).length;
    const approvedProcurements = dashboard.procurements.filter((row) =>
      isApprovedStatus(row.status),
    ).length;
    const returnedPayments = dashboard.payments.filter((row) =>
      isReturnedStatus(row.status),
    ).length;
    const returnedProcurements = dashboard.procurements.filter((row) =>
      isReturnedStatus(row.status),
    ).length;
    const sentToFinance = dashboard.payments.filter(
      (row) =>
        normalize(row.status).includes("sent_to_finance") ||
        normalize(row.status).includes("finance"),
    ).length;
    const paidPayments = dashboard.payments.filter(
      (row) =>
        normalize(row.status).includes("paid") || toNumber(row.paid_amount) > 0,
    ).length;
    const completedRecords =
      dashboard.payments.filter(
        (row) =>
          normalize(row.status).includes("completed") ||
          normalize(row.status).includes("paid"),
      ).length +
      dashboard.procurements.filter((row) =>
        normalize(row.status).includes("completed"),
      ).length;
    const budgetUtilization =
      adjustedBudget > 0 ? Math.round((debit / adjustedBudget) * 100) : 0;

    return {
      approvedPayment,
      paidPayment,
      procurementAmount,
      adjustedBudget,
      budgetBalance,
      debit,
      paymentPending,
      procurementPending,
      approvedPayments,
      approvedProcurements,
      returnedRequests: returnedPayments + returnedProcurements,
      sentToFinance,
      paidPayments,
      completedRecords,
      paymentCount: dashboard.payments.length,
      procurementCount: dashboard.procurements.length,
      budgetCount: dashboard.budgets.length,
      budgetUtilization,
      openWorkload: paymentPending + procurementPending,
    };
  }, [dashboard]);

  const kpis = useMemo<KpiDefinition[]>(() => {
    const budgetCard: KpiDefinition = {
      title: "Budget Balance",
      value: compactMoney(totals.budgetBalance),
      description: `${totals.budgetUtilization}% budget utilized`,
      icon: WalletCards,
      href: "/dashboard/budgets",
    };

    const byRole: Record<RoleDashboardScope, KpiDefinition[]> = {
      super_admin: [
        {
          title: "Total Users",
          value: "-",
          description: "User count is loaded from user management",
          icon: Users,
          href: "/dashboard/users",
        },
        {
          title: "Total Offices",
          value: "-",
          description: "Office count is loaded from offices",
          icon: Building2,
          href: "/dashboard/offices",
        },
        {
          title: "Total Departments",
          value: "-",
          description: "Department count is loaded from departments",
          icon: Landmark,
          href: "/dashboard/departments",
        },
        {
          title: "Total Payments",
          value: totals.paymentCount,
          description: compactMoney(totals.approvedPayment),
          icon: Banknote,
          href: "/dashboard/payment",
        },
        {
          title: "Total Procurements",
          value: totals.procurementCount,
          description: compactMoney(totals.procurementAmount),
          icon: PackageCheck,
          href: "/dashboard/procurement",
        },
        {
          title: "Pending Workflow Actions",
          value: totals.openWorkload,
          description: `${totals.paymentPending} payment, ${totals.procurementPending} procurement`,
          icon: Clock3,
          href: "/dashboard/notifications",
        },
      ],
      manager: [
        {
          title: "Payments Pending Approval",
          value: totals.paymentPending,
          description: "Payments waiting for manager action",
          icon: Clock3,
          href: "/dashboard/payment",
        },
        {
          title: "Procurements Pending Approval",
          value: totals.procurementPending,
          description: "Procurements waiting for manager action",
          icon: BriefcaseBusiness,
          href: "/dashboard/procurement",
        },
        {
          title: "Approved Payments",
          value: totals.approvedPayments,
          description: compactMoney(totals.approvedPayment),
          icon: CheckCircle2,
          href: "/dashboard/payment",
        },
        {
          title: "Approved Procurements",
          value: totals.approvedProcurements,
          description: compactMoney(totals.procurementAmount),
          icon: FileCheck2,
          href: "/dashboard/procurement",
        },
        budgetCard,
        {
          title: "Open Workload",
          value: totals.openWorkload,
          description: "Pending workflow actions",
          icon: Activity,
          href: "/dashboard/notifications",
        },
      ],
      head_of_development_branch: [
        {
          title: "Pending Payments",
          value: totals.paymentPending,
          description: "Payments awaiting review",
          icon: Clock3,
          href: "/dashboard/payment",
        },
        {
          title: "Pending Procurements",
          value: totals.procurementPending,
          description: "Procurements awaiting review",
          icon: BriefcaseBusiness,
          href: "/dashboard/procurement",
        },
        {
          title: "Approved This Month",
          value: totals.approvedPayments + totals.approvedProcurements,
          description: "Approved requests in current scope",
          icon: CheckCircle2,
        },
        {
          title: "Returned Requests",
          value: totals.returnedRequests,
          description: "Returned or rejected requests",
          icon: FileText,
        },
        budgetCard,
      ],
      head_of_service_branch: [
        {
          title: "Pending Payments",
          value: totals.paymentPending,
          description: "Payments awaiting review",
          icon: Clock3,
          href: "/dashboard/payment",
        },
        {
          title: "Pending Procurements",
          value: totals.procurementPending,
          description: "Procurements awaiting review",
          icon: BriefcaseBusiness,
          href: "/dashboard/procurement",
        },
        {
          title: "Approved This Month",
          value: totals.approvedPayments + totals.approvedProcurements,
          description: "Approved requests in current scope",
          icon: CheckCircle2,
        },
        {
          title: "Returned Requests",
          value: totals.returnedRequests,
          description: "Returned or rejected requests",
          icon: FileText,
        },
        budgetCard,
      ],
      team_leader: [
        {
          title: "Pending Budget Reviews",
          value: totals.paymentPending + totals.procurementPending,
          description: "Requests waiting for budget/team review",
          icon: WalletCards,
          href: "/dashboard/payment",
        },
        {
          title: "Pending Expert Assignments",
          value: totals.openWorkload,
          description: "Open assignment queue",
          icon: Users,
        },
        {
          title: "Approved Requests",
          value: totals.approvedPayments + totals.approvedProcurements,
          description: "Approved by team flow",
          icon: CheckCircle2,
        },
        {
          title: "Open Workload",
          value: totals.openWorkload,
          description: "Pending payment and procurement",
          icon: Activity,
        },
        ...(canViewBudget ? [budgetCard] : []),
      ],
      expert: [
        {
          title: "Assigned Payments",
          value: totals.paymentCount,
          description: `${totals.paymentPending} pending payment reviews`,
          icon: Banknote,
          href: "/dashboard/payment",
        },
        {
          title: "Assigned Procurements",
          value: totals.procurementCount,
          description: `${totals.procurementPending} pending procurement reviews`,
          icon: PackageCheck,
          href: "/dashboard/procurement",
        },
        {
          title: "Completed Reviews",
          value: totals.approvedPayments + totals.approvedProcurements,
          description: "Completed or approved reviews",
          icon: CheckCircle2,
        },
        {
          title: "Pending Reviews",
          value: totals.openWorkload,
          description: "Assigned pending reviews",
          icon: Clock3,
        },
        ...(canViewBudget ? [budgetCard] : []),
      ],
      record_officer: [
        {
          title: "Pending Record Processing",
          value: totals.openWorkload,
          description: "Ready for record office processing",
          icon: FileText,
          href: "/dashboard/payment",
        },
        {
          title: "Pending Exit",
          value: totals.paymentPending,
          description: "Payments needing exit processing",
          icon: Printer,
        },
        {
          title: "Sent To Finance",
          value: totals.sentToFinance,
          description: "Payments sent to finance",
          icon: Send,
        },
        {
          title: "Completed Records",
          value: totals.completedRecords,
          description: "Completed payment/procurement records",
          icon: CheckCircle2,
        },
      ],
      accountant: [
        {
          title: "Pending Finance Payments",
          value: totals.paymentPending,
          description: "Payments waiting for finance action",
          icon: Clock3,
          href: "/dashboard/payment",
        },
        {
          title: "Paid Payments",
          value: totals.paidPayments,
          description: "Payments marked as paid",
          icon: CheckCircle2,
        },
        {
          title: "Total Paid Amount",
          value: compactMoney(totals.paidPayment),
          description: "Total paid in current scope",
          icon: Banknote,
        },
        {
          title: "Monthly Paid Amount",
          value: compactMoney(totals.paidPayment),
          description: "Filtered monthly paid amount",
          icon: TrendingUp,
        },
      ],
      secretory: [
        {
          title: "My Payment Requests",
          value: totals.paymentCount,
          description: "Payment requests created/handled by you",
          icon: Banknote,
          href: "/dashboard/payment",
        },
        {
          title: "My Procurement Requests",
          value: totals.procurementCount,
          description: "Procurement requests created/handled by you",
          icon: PackageCheck,
          href: "/dashboard/procurement",
        },
        {
          title: "Pending Requests",
          value: totals.openWorkload,
          description: "Pending own requests",
          icon: Clock3,
        },
        {
          title: "Approved Requests",
          value: totals.approvedPayments + totals.approvedProcurements,
          description: "Approved own requests",
          icon: CheckCircle2,
        },
        {
          title: "Rejected Requests",
          value: totals.returnedRequests,
          description: "Returned or rejected own requests",
          icon: FileText,
        },
      ],
    };

    return byRole[scope];
  }, [scope, totals, canViewBudget]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border bg-card">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {tt("Loading dashboard...")}
      </div>
    );
  }

  return (
    <div key={i18n.language} className="w-full max-w-full min-w-0 space-y-4 overflow-hidden px-3 pb-6 sm:px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{tt("Dashboards")}</span>
          <span>/</span>
          <span className="font-semibold text-foreground">
            {tt(config.badge)}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          {tt("Refresh")}
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-900/20 bg-slate-950 text-white shadow-sm">
        <div className="relative isolate px-5 py-5 md:px-7">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  {tt(config.badge)}
                </Badge>
                <span className="text-xs text-slate-300">
                  {tt("Fiscal year")} {filters.fiscal_year || tt("All")}
                </span>
              </div>
              <div>
                <h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                  {tt(config.title)}
                </h1>
                <p className="mt-1 max-w-3xl break-words text-sm text-slate-300">
                  {totals.openWorkload} pending workflow action
                  {totals.openWorkload === 1 ? "" : "s"},{" "}
                  {totals.approvedPayments + totals.approvedProcurements}{" "}
                  approved request
                  {totals.approvedPayments + totals.approvedProcurements === 1
                    ? ""
                    : "s"}
                  , and{" "}
                  {canViewBudget
                    ? `${totals.budgetUtilization}% budget utilization`
                    : "role-based operational visibility"}
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {scope === "secretory" ? (
                <Button
                  asChild
                  size="sm"
                  className="bg-white text-slate-950 hover:bg-slate-100"
                >
                  <Link href="/dashboard/payment/create">
                    <Plus className="mr-2 h-4 w-4" />
                    {tt("Create Payment")}
                  </Link>
                </Button>
              ) : null}
              {scope === "secretory" ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/dashboard/procurement/create">
                    <Plus className="mr-2 h-4 w-4" />
                    {tt("Create Procurement")}
                  </Link>
                </Button>
              ) : null}
              {scope === "record_officer" ? (
                <Button
                  asChild
                  size="sm"
                  className="bg-white text-slate-950 hover:bg-slate-100"
                >
                  <Link href="/dashboard/payment">
                    <Printer className="mr-2 h-4 w-4" />
                    {tt("Process Records")}
                  </Link>
                </Button>
              ) : null}
              {scope === "accountant" ? (
                <Button
                  asChild
                  size="sm"
                  className="bg-white text-slate-950 hover:bg-slate-100"
                >
                  <Link href="/dashboard/payment">
                    <Banknote className="mr-2 h-4 w-4" />
                    {tt("Finance Queue")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.slice(0, 4).map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <BarChartCard
          title={
            scope === "accountant"
              ? "Monthly Payment Trend"
              : scope === "super_admin"
                ? "Monthly Transactions"
                : "Approval Volume"
          }
          rows={
            dashboard.charts.payment_by_category?.length
              ? dashboard.charts.payment_by_category
              : dashboard.charts.payment_status_summary
          }
          amount
        />
        <DonutChart
          title={
            scope === "accountant"
              ? "Paid By Payment Type"
              : scope === "super_admin"
                ? "Status Distribution"
                : "Status Distribution"
          }
          rows={
            dashboard.charts.payment_status_summary?.length
              ? dashboard.charts.payment_status_summary
              : dashboard.charts.procurement_status_summary
          }
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as DashboardTab)}
          className="min-w-0 space-y-3"
        >
          <div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-lg bg-muted p-1 sm:w-auto">
              {canViewBudget ? (
                <TabsTrigger
                  value="budget"
                  className="h-8 flex-1 px-3 sm:flex-none"
                >
                  {tt("Budget")}
                </TabsTrigger>
              ) : null}
              <TabsTrigger
                value="payment"
                className="h-8 flex-1 px-3 sm:flex-none"
              >
                {tt("Payment")}
              </TabsTrigger>
              {canViewProcurement ? (
                <TabsTrigger
                  value="procurement"
                  className="h-8 flex-1 px-3 sm:flex-none"
                >
                  {tt("Procurement")}
                </TabsTrigger>
              ) : null}
            </TabsList>
            <Badge variant="secondary">
              {isFetching ? tt("Updating...") : tt("Live data")}
            </Badge>
          </div>

          <FilterBar tab={tab} filters={filters} setFilters={setFilters} />

          <TabsContent value="payment" className="space-y-3">
            {!canViewPayment ? (
              <EmptyScope message="This role has no payment dashboard scope." />
            ) : (
              <PaymentTable
                title={config.paymentTableTitle}
                scope={scope}
                payments={dashboard.payments}
              />
            )}
          </TabsContent>

          <TabsContent value="procurement" className="space-y-3">
            {!canViewProcurement ? (
              <EmptyScope message="This role has no procurement dashboard scope." />
            ) : (
              <ProcurementTable
                title={config.procurementTableTitle}
                procurements={dashboard.procurements}
              />
            )}
          </TabsContent>

          {canViewBudget ? (
            <TabsContent value="budget" className="space-y-3">
              <BudgetTable budgets={dashboard.budgets} />
            </TabsContent>
          ) : null}
        </Tabs>

        <div className="min-w-0 space-y-4">
          <Card className="min-w-0 rounded-xl border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  {tt("Workload Summary")}
                </span>
                <Badge variant="outline">
                  {totals.openWorkload} {tt("open")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {tt("Pending payments")}
                </span>
                <span className="font-semibold">{totals.paymentPending}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {tt("Pending procurements")}
                </span>
                <span className="font-semibold">
                  {totals.procurementPending}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {tt("Approved requests")}
                </span>
                <span className="font-semibold">
                  {totals.approvedPayments + totals.approvedProcurements}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {tt("Returned requests")}
                </span>
                <span className="font-semibold">{totals.returnedRequests}</span>
              </div>
            </CardContent>
          </Card>

          {canViewBudget ? (
            <Card className="min-w-0 rounded-xl border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <WalletCards className="h-4 w-4 text-primary" />
                  {tt("Budget Utilization")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {tt("Adjusted budget")}
                    </span>
                    <span className="font-semibold">
                      {compactMoney(totals.adjustedBudget)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, Math.max(2, totals.budgetUtilization))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{tt("Balance")}</span>
                  <span className="font-semibold">
                    {compactMoney(totals.budgetBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{tt("Debit")}</span>
                  <span className="font-semibold">
                    {compactMoney(totals.debit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <BarChartCard
            title={canViewProcurement ? "Procurement Status" : "Payment Status"}
            rows={
              canViewProcurement
                ? dashboard.charts.procurement_status_summary
                : dashboard.charts.payment_status_summary
            }
          />
        </div>
      </div>
    </div>
  );
}
const TABLE_PAGE_SIZE = 5;

function getPageRows<T>(rows: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * TABLE_PAGE_SIZE;

  return {
    page: safePage,
    totalPages,
    rows: rows.slice(start, start + TABLE_PAGE_SIZE),
    start: rows.length ? start + 1 : 0,
    end: Math.min(start + TABLE_PAGE_SIZE, rows.length),
  };
}

function TablePagination({
  page,
  totalPages,
  totalRows,
  start,
  end,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalRows: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
}) {
  const tt = useDbTranslation();

  if (totalRows <= TABLE_PAGE_SIZE) return null;

  return (
    <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        {tt("Showing")} {start}-{end} {tt("of")} {totalRows}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          {tt("Previous")}
        </Button>
        <span className="min-w-[4rem] text-center text-xs font-medium text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          {tt("Next")}
        </Button>
      </div>
    </div>
  );
}

function PaymentTable({
  title,
  scope,
  payments,
}: {
  title: string;
  scope: RoleDashboardScope;
  payments: any[];
}) {
  const tt = useDbTranslation();
  const [page, setPage] = useState(1);
  const pagination = getPageRows(payments, page);

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span>{tt(title)}</span>
          {scope === "accountant" ? (
            <Badge variant="secondary">
              {tt("Action")}: {tt("Mark As Paid")}
            </Badge>
          ) : null}
          {scope === "record_officer" ? (
            <Badge variant="secondary">
              {tt("Actions")}: {tt("Print Remaining")} / {tt("Print Exit")} /{" "}
              {tt("Send To Finance")}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>{tt("Payment No")}</TableHead>
                <TableHead>{tt("Category")}</TableHead>
                <TableHead>{tt("Payment Type")}</TableHead>
                <TableHead className="text-right">
                  {tt("Approved Amount")}
                </TableHead>
                <TableHead className="text-right">
                  {tt("Paid Amount")}
                </TableHead>
                <TableHead>{tt("Status")}</TableHead>
                <TableHead>{tt("Budget Code")}</TableHead>
                <TableHead>{tt("Approved Date")}</TableHead>
                <TableHead className="text-right">{tt("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length ? (
                pagination.rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      {row.payment_no ?? "-"}
                    </TableCell>
                    <TableCell>{row.category ?? "-"}</TableCell>
                    <TableCell>{row.type ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {money(row.approved_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(row.paid_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusTone(row.status)}`}
                      >
                        {tt(statusLabel(row.status))}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.allocated_budget_code ?? "-"}</TableCell>
                    <TableCell>{date(row.approved_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/payment/${row.id}`}>
                            <Eye className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              {tt("Detail")}
                            </span>
                          </Link>
                        </Button>
                        {scope === "record_officer" ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/payment/${row.id}/print`}>
                              <Printer className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">
                                {tt("Print")}
                              </span>
                            </Link>
                          </Button>
                        ) : null}
                        {scope === "accountant" ? (
                          <Button asChild size="sm">
                            <Link href={`/dashboard/payment/${row.id}`}>
                              {tt("Mark Paid")}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {tt("No payment records found for this role and filter.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalRows={payments.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}

function ProcurementTable({
  title,
  procurements,
}: {
  title: string;
  procurements: any[];
}) {
  const tt = useDbTranslation();
  const [page, setPage] = useState(1);
  const pagination = getPageRows(procurements, page);

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="text-base">{tt(title)}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>{tt("Procurement No")}</TableHead>
                <TableHead>{tt("Customer Name")}</TableHead>
                <TableHead>{tt("Category")}</TableHead>
                <TableHead>{tt("Type")}</TableHead>
                <TableHead>{tt("Budget Code")}</TableHead>
                <TableHead className="text-right">{tt("Amount")}</TableHead>
                <TableHead>{tt("Status")}</TableHead>
                <TableHead>{tt("Approved Date")}</TableHead>
                <TableHead className="text-right">{tt("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procurements.length ? (
                pagination.rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      {row.procurement_no ?? "-"}
                    </TableCell>
                    <TableCell>{row.customer_name ?? "-"}</TableCell>
                    <TableCell>{row.category ?? "-"}</TableCell>
                    <TableCell>{row.type ?? "-"}</TableCell>
                    <TableCell>{row.budget_code ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {money(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusTone(row.status)}`}
                      >
                        {tt(statusLabel(row.status))}
                      </Badge>
                    </TableCell>
                    <TableCell>{date(row.approved_date)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/procurement/${row.id}`}>
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">
                            {tt("Detail")}
                          </span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {tt(
                      "No procurement records found for this role and filter.",
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalRows={procurements.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
      </CardContent>
    </Card>
  );
}

function BudgetTable({ budgets }: { budgets: any[] }) {
  const tt = useDbTranslation();

  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>{tt("Budget Transactions")}</span>
          <Badge variant="secondary">
            {budgets.length} {tt("accounts")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>{tt("BI Code")}</TableHead>
                <TableHead>{tt("Account Code")}</TableHead>
                <TableHead>{tt("Account Description")}</TableHead>
                <TableHead className="text-right">
                  {tt("Adjusted Budget")}
                </TableHead>
                <TableHead className="text-right">
                  Balance Not Committed
                </TableHead>
                <TableHead className="text-right">{tt("Debit")}</TableHead>
                <TableHead className="text-right">{tt("Credit")}</TableHead>
                <TableHead>{tt("Status")}</TableHead>
                <TableHead className="text-right">{tt("Action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length ? (
                budgets.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      {row.bi_code ?? "-"}
                    </TableCell>
                    <TableCell>{row.account_code ?? "-"}</TableCell>
                    <TableCell>{row.account_description ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {money(row.adjusted_budget)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(row.balance_not_committed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(row.debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(row.credit)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusTone(row.status)}`}
                      >
                        {tt(statusLabel(row.status))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/budgets/${row.id}`}>
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">
                            {tt("Detail")}
                          </span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {tt("No budget records found for this role and filter.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
