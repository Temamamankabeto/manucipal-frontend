import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardConfig, type AppRoleKey } from "@/config/dashboard.config";

export default async function RoleDashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const config = dashboardConfig[role as AppRoleKey];
  if (!config) notFound();
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Municipality workspace</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{config.title}</h1>
          <p className="mt-1 text-muted-foreground">{config.subtitle}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-4 text-primary"><Icon className="h-8 w-8" /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Pending Verifications" value="Workflow" description="Open citizen verification queue" />
        <Metric title="Duplicate Alerts" value="Review" description="Detected duplicate registrations" />
        <Metric title="Active Citizens" value="Reports" description="Ready for reporting module" />
      </div>
    </div>
  );
}

function Metric({ title, value, description }: { title: string; value: string; description: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>;
}
