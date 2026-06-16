"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentRequests } from "@/hooks/payment/use-payment";
import { authService } from "@/services/auth/auth.service";

function normalizeRole(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

export default function PaymentPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("status") ?? "";
  });
  const [page, setPage] = useState(1);

  const roles = authService.getStoredRoles().map(normalizeRole);
  const isFinanceAccountant = roles.includes("finance-accountant") || roles.includes("finance") || roles.includes("accountant");
  const canCreatePayment = roles.some((role) =>
    [
      "super-admin",
      "manager",
      "head-of-development-branch",
      "head-development-branch",
      "head-of-service-branch",
      "head-service-branch",
      "planning-budget-team-leader",
      "planning-and-budget-team-leader",
      "payment-requester",
      "record-office",
      "records-office",
    ].includes(role)
  );
  const queryStatus = status || (isFinanceAccountant ? "sent_to_finance" : "");
  const query = usePaymentRequests({ search, status: queryStatus, page, per_page: 10 });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  useEffect(() => {
    setPage(1);
  }, [search, queryStatus]);

  const title = useMemo(() => {
    if (queryStatus === "sent_to_finance") return "Pending Finance";
    if (queryStatus === "paid") return "Paid Payments";
    return "Payment Requests";
  }, [queryStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Payment workflow from requester to finance.
          </p>
        </div>

        {canCreatePayment ? (
          <Button asChild>
            <Link href="/dashboard/payment/create">
              <Plus className="mr-2 h-4 w-4" />
              New Payment Request
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFinanceAccountant ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={queryStatus === "sent_to_finance" ? "default" : "outline"}
                onClick={() => setStatus("sent_to_finance")}
              >
                Pending Finance
              </Button>
              <Button
                type="button"
                variant={queryStatus === "paid" ? "default" : "outline"}
                onClick={() => setStatus("paid")}
              >
                Paid Payments
              </Button>
            </div>
          ) : null}

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search payment no, title, reference"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment No</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Approved Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.payment_no}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{Number(request.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{request.paid_amount ? Number(request.paid_amount).toFixed(2) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === "rejected" ? "destructive" : "secondary"}>
                        {request.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.reference_no ?? "-"}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/payment/${request.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No payment requests found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing page {meta.current_page} of {meta.last_page} • {meta.total} request(s)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page || query.isFetching}
                  onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
