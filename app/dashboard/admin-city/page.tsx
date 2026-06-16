import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RoleDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">City Admin Dashboard</h1>
        <p className="text-muted-foreground">Municipality citizen management workspace.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Citizen Dashboard</CardTitle></CardHeader><CardContent><Button asChild><Link href="/dashboard/citizen-dashboard">Open</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Households</CardTitle></CardHeader><CardContent><Button asChild variant="outline"><Link href="/dashboard/households">Manage</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Reports</CardTitle></CardHeader><CardContent><Button asChild variant="outline"><Link href="/dashboard/reports/citizens">View reports</Link></Button></CardContent></Card>
      </div>
    </div>
  );
}
