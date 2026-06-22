"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

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

function translationKey(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRole(value?: string | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function useDbTranslation() {
  const { t, i18n } = useTranslation();

  return (value?: string | null) => {
    const text = String(value ?? "");
    const key = translationKey(text);

    if (!key) return text;

    // This keeps the payment page subscribed to i18n language changes.
    void i18n.language;

    const translated = t(key);
    return translated && translated !== key ? translated : text;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const tt = useDbTranslation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("status") ?? "";
  });
  const [page, setPage] = useState(1);

  const roles = authService.getStoredRoles().map(normalizeRole);
  const isFinanceAccountant = roles.includes("finance-accountant") || roles.includes("finance") || roles.includes("accountant");
  const canCreatePayment = roles.length > 0 || Boolean(authService.getStoredUser());
  const queryStatus = status || (isFinanceAccountant ? "sent_to_finance" : "");
  const query = usePaymentRequests({ search, status: queryStatus, page, per_page: 10 });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  useEffect(() => {
    setPage(1);
  }, [search, queryStatus]);

  const title =
    queryStatus === "sent_to_finance"
      ? tt("pending_finance")
      : queryStatus === "paid"
        ? tt("paid_payments")
        : tt("payment_requests");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {tt("payment_workflow_from_requester_to_finance")}
          </p>
        </div>

        {canCreatePayment ? (
          <Button asChild>
            <Link href="/dashboard/payment/create">
              <Plus className="mr-2 h-4 w-4" />
              {tt("new_payment_request")}
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tt("requests")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFinanceAccountant ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={queryStatus === "sent_to_finance" ? "default" : "outline"}
                onClick={() => setStatus("sent_to_finance")}
              >
                {tt("pending_finance")}
              </Button>
              <Button
                type="button"
                variant={queryStatus === "paid" ? "default" : "outline"}
                onClick={() => setStatus("paid")}
              >
                {tt("paid_payments")}
              </Button>
            </div>
          ) : null}

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={tt("search_payment_no_payment_type_reference")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tt("payment_no")}</TableHead>
                  <TableHead>{tt("payment_type")}</TableHead>
                  <TableHead>{tt("approved_amount")}</TableHead>
                  <TableHead>{tt("paid_amount")}</TableHead>
                  <TableHead>{tt("status")}</TableHead>
                  <TableHead>{tt("reference")}</TableHead>
                  <TableHead>{tt("action")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.payment_no}</TableCell>
                    <TableCell>{tt(request.payment_type?.name ?? request.title ?? "-")}</TableCell>
                    <TableCell>{Number(request.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{request.paid_amount ? Number(request.paid_amount).toFixed(2) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === "rejected" ? "destructive" : "secondary"}>
                        {tt(request.status?.replaceAll("_", " ") ?? "-")}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.reference_no ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/payment/${request.id}`)}
                      >
                        {tt("open")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      {tt("no_payment_requests_found")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {`${tt("Showing page")} ${meta.current_page} ${tt("of")} ${meta.last_page} · ${meta.total} ${tt("requests")}`}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {tt("previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page || query.isFetching}
                  onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
                >
                  {tt("next")}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
