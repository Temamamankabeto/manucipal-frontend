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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCreatePaymentCategory,
  useDeletePaymentCategory,
  usePaymentCategories,
  useUpdatePaymentCategory,
} from "@/hooks/payment/use-payment-master-data";
import type { PaymentCategory } from "@/types/payment/payment-master-data.type";

export default function PaymentCategoriesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentCategory | null>(null);
  const [deleting, setDeleting] = useState<PaymentCategory | null>(null);
  const [name, setName] = useState("");

  const params = useMemo(() => ({ search, per_page: 50 }), [search]);
  const query = usePaymentCategories(params);
  const createMutation = useCreatePaymentCategory();
  const updateMutation = useUpdatePaymentCategory();
  const deleteMutation = useDeletePaymentCategory();
  const rows = query.data?.data ?? [];
  const errorMessage = query.error instanceof Error ? query.error.message : null;

  function resetForm() {
    setEditing(null);
    setName("");
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(category: PaymentCategory) {
    setEditing(category);
    setName(category.name);
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload: { name } });
      toast.success("Payment category updated");
    } else {
      await createMutation.mutateAsync({ name });
      toast.success("Payment category created");
    }

    setOpen(false);
    resetForm();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.id);
    toast.success("Payment category deleted");
    setDeleting(null);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Categories</h1>
          <p className="text-sm text-muted-foreground">Manage reusable payment category names.</p>
        </div>

        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Payment Category" : "Create Payment Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Salary Payment" required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorMessage ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-destructive">{errorMessage}</TableCell></TableRow>
                ) : query.isLoading ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
                ) : rows.length > 0 ? rows.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.types_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(category)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleting(category)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No payment categories found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(value) => !value && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment category?</AlertDialogTitle>
            <AlertDialogDescription>This will also remove payment types under this category. Existing payment request text values are not changed.</AlertDialogDescription>
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
