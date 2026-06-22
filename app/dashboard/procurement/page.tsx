"use client";

import Link from "next/link";
import { useState } from "react";
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
import { useProcurementRequests } from "@/hooks/procurement/use-procurement";
import { authService } from "@/services/auth/auth.service";

function normalizeRole(role?: string | null) {
  return (role || "").toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
}

function canCreateProcurement() {
  return Boolean(authService.getStoredUser() || authService.getStoredRoles().length);
}

export default function ProcurementPage() {
  const [search, setSearch] = useState("");
  const query = useProcurementRequests({ search, per_page: 20 });
  const rows = query.data?.data ?? [];
  const canCreate = canCreateProcurement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Procurement Requests</h1>
          <p className="text-sm text-muted-foreground">
            Document workflow from requester to finance.
          </p>
        </div>

        {canCreate ? (
          <Button asChild>
            <Link href="/dashboard/procurement/create">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search request no, title, reference"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request No</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Requester Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget Code</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.request_no}
                    </TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.requester_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {request.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.budget_code ?? "-"}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/procurement/${request.id}`}>
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No procurement requests found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
