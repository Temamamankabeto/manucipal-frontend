"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCreatePaymentType,
  useDeletePaymentType,
  usePaymentCategories,
  usePaymentTypes,
  useUpdatePaymentType,
} from "@/hooks/payment/use-payment-master-data";
import type { PaymentType } from "@/types/payment/payment-master-data.type";

export default function PaymentTypesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentType | null>(null);
  const [deleting, setDeleting] = useState<PaymentType | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");

  const params = useMemo(() => ({ search, category_id: categoryFilter, per_page: 50 }), [search, categoryFilter]);
  const categoriesQuery = usePaymentCategories({ per_page: 100 });
  const typesQuery = usePaymentTypes(params);
  const createMutation = useCreatePaymentType();
  const updateMutation = useUpdatePaymentType();
  const deleteMutation = useDeletePaymentType();

  const categories = categoriesQuery.data?.data ?? [];
  const rows = typesQuery.data?.data ?? [];
  const errorMessage = typesQuery.error instanceof Error ? typesQuery.error.message : null;

  function resetForm() {
    setEditing(null);
    setCategoryId("");
    setName("");
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(type: PaymentType) {
    setEditing(type);
    setCategoryId(String(type.category_id));
    setName(type.name);
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = { category_id: categoryId, name };

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
      toast.success("Payment type updated");
    } else {
      await createMutation.mutateAsync(payload);
      toast.success("Payment type created");
    }

    setOpen(false);
    resetForm();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.id);
    toast.success("Payment type deleted");
    setDeleting(null);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Types</h1>
          <p className="text-sm text-muted-foreground">Manage payment types linked to payment categories.</p>
        </div>

        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Payment Type" : "Create Payment Type"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-name">Name</Label>
                <Input id="type-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Utility Bill" required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={saving || !categoryId}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Types List</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_280px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search payment types" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorMessage ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-destructive">{errorMessage}</TableCell></TableRow>
                ) : typesQuery.isLoading ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : rows.length > 0 ? rows.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.category?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(type)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleting(type)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No payment types found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment type?</AlertDialogTitle>
            <AlertDialogDescription>Existing payment requests that already saved this type as text are not changed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
