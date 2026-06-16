import Link from "next/link";
import { BarChart3, ClipboardCheck, CreditCard, FileText, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const metrics = [
  { title: "Payment Forms", value: "Processing", description: "Complete budget codes, office codes, and payment form rows.", icon: CreditCard },
  { title: "Procurements", value: "Review", description: "Track procurement requests related to budget verification.", icon: ClipboardCheck },
  { title: "Reports", value: "Live", description: "Open payment and procurement reporting workspace.", icon: BarChart3 },
];

const workQueue = [
  { label: "Budget form completion", value: 72 },
  { label: "Payment verification", value: 58 },
  { label: "Procurement review", value: 44 },
];

export default function PlanningBudgetExpertDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="bg-gradient-to-r from-primary/15 via-background to-background p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">Planning & Budget Expert</Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Budget Processing Dashboard</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Professional workspace for payment form completion, procurement review, and financial reporting.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/payment">Open Payments</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/procurement">Open Procurements</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Workload Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {workQueue.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/payment">Payments</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/procurement">Procurements</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/reports/procurement-payment?type=payment">Payment Report</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/reports/procurement-payment?type=procurement">Procurement Report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
