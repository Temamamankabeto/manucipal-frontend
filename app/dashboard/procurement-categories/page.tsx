"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateProcurementCategory,
  useDeleteProcurementCategory,
  useProcurementCategories,
  useUpdateProcurementCategory,
} from "@/hooks/procurement/use-procurement-master-data";
import type { ProcurementCategory } from "@/types/procurement/procurement-master-data.type";

export default function ProcurementCategoriesPage() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ProcurementCategory | null>(null);

  const params = useMemo(() => ({ search, per_page: 50 }), [search]);
  const categoriesQuery = useProcurementCategories(params);
  const createMutation = useCreateProcurementCategory();
  const updateMutation = useUpdateProcurementCategory();
  const deleteMutation = useDeleteProcurementCategory();

  const rows = categoriesQuery.data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function resetForm() {
    setEditing(null);
    setName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = { name: name.trim() };
    if (!payload.name) return;

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    resetForm();
  }

  function startEdit(category: ProcurementCategory) {
    setEditing(category);
    setName(category.name);
  }

  async function handleDelete(category: ProcurementCategory) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    await deleteMutation.mutateAsync(category.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Procurement Categories</h1>
        <p className="text-sm text-muted-foreground">Manage high-level procurement classifications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Category" : "Create Category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="Fixed Asset, Machinery, Operational"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                <Plus className="mr-2 h-4 w-4" />
                {editing ? "Update" : "Create"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
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
                {rows.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.types_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(category)} disabled={deleteMutation.isPending}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No procurement categories found.
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
