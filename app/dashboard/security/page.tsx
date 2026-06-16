import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlaceholderPage() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="capitalize">security</CardTitle>
        <CardDescription>Municipality module workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-10 text-center text-muted-foreground">
          This section is ready for municipality workflow implementation.
        </div>
      </CardContent>
    </Card>
  );
}
