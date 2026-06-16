import Link from "next/link";
import { CheckCircle2, Clock3, RotateCcw, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  { title: "Pending Machinery Reviews", value: "Review", icon: Clock3 },
  { title: "Approved Machinery Requests", value: "Approved", icon: CheckCircle2 },
  { title: "Returned Requests", value: "Returned", icon: RotateCcw },
];

export default function MachineryTeamLeaderDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Procurement workspace</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Machinery Team Leader Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Review machinery procurement requests and technical requirements.</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-4 text-primary">
          <Truck className="h-8 w-8" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">Open procurement list to view live records.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/procurement">Open Procurements</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/reports/procurement-payment?type=procurement">Procurement Report</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
