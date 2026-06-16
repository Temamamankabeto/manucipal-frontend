"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateProcurementType,
  useDeleteProcurementType,
  useProcurementCategories,
  useProcurementTypes,
  useUpdateProcurementType,
} from "@/hooks/procurement/use-procurement-master-data";
import type { ProcurementType } from "@/types/procurement/procurement-master-data.type";

export default function ProcurementTypesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ProcurementType | null>(null);

  const params = useMemo(() => ({ search, per_page: 50 }), [search]);
  const categoriesQuery = useProcurementCategories({ per_page: 100 });
  const typesQuery = useProcurementTypes(params);
  const createMutation = useCreateProcurementType();
  const updateMutation = useUpdateProcurementType();
  const deleteMutation = useDeleteProcurementType();

  const categories = categoriesQuery.data?.data ?? [];
  const rows = typesQuery.data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function resetForm() {
    setEditing(null);
    setCategoryId("");
    setName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = { category_id: categoryId, name: name.trim() };
    if (!payload.category_id || !payload.name) return;

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    resetForm();
  }

  function startEdit(type: ProcurementType) {
    setEditing(type);
    setCategoryId(String(type.category_id));
    setName(type.name);
  }

  async function handleDelete(type: ProcurementType) {
    if (!window.confirm(`Delete ${type.name}?`)) return;
    await deleteMutation.mutateAsync(type.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Procurement Types</h1>
        <p className="text-sm text-muted-foreground">Manage procurement types under each category.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Type" : "Create Type"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-name">Name</Label>
              <Input id="type-name" placeholder="Computer, Vehicle, Stationery" value={name} onChange={(event) => setName(event.target.value)} required />
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
          <CardTitle>Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search procurement types" value={search} onChange={(event) => setSearch(event.target.value)} />
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
                {rows.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.category?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(type)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(type)} disabled={deleteMutation.isPending}>
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
                      No procurement types found.
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
