"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProcurementRequest } from "@/hooks/procurement/use-procurement";
import { useProcurementCategories, useProcurementTypes } from "@/hooks/procurement/use-procurement-master-data";
import { authService } from "@/services/auth/auth.service";

function normalizeRole(role?: string | null) {
  return (role || "").toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
}

function canCreateProcurement() {
  return Boolean(authService.getStoredUser() || authService.getStoredRoles().length);
}

export default function CreateProcurementPage() {
  const router = useRouter();
  const canCreate = canCreateProcurement();

  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [requesterType, setRequesterType] = useState("Municipal Team Leaders");
  const [categoryId, setCategoryId] = useState("");
  const [procurementTypeId, setProcurementTypeId] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const categoriesQuery = useProcurementCategories({ per_page: 100 });
  const typesQuery = useProcurementTypes({ category_id: categoryId, per_page: 100 });
  const categories = categoriesQuery.data?.data ?? [];
  const types = typesQuery.data?.data ?? [];
  const [scanInputKey, setScanInputKey] = useState(0);

  const createMutation = useCreateProcurementRequest(() => {
    toast.success("Procurement request created");
    router.push("/dashboard/procurement");
  });

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!categoryId || !procurementTypeId) {
      toast.error("Please select procurement category and type");
      return;
    }

    createMutation.mutate({
      requester_type: requesterType,
      category_id: categoryId,
      procurement_type_id: procurementTypeId,
      title: customerName,
      description,
      submission_method: attachments.length > 0 ? "online_form_with_scanned_letter" : "online_form",
      items: [],
      attachments,
    });
  }

  if (!canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Action only</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your role cannot create procurement requests. You can only review and take workflow actions assigned to your role.
          </p>
          <Button type="button" onClick={() => router.push("/dashboard/procurement")}>
            Back to Procurement
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Procurement Request</h1>
        <p className="text-sm text-muted-foreground">
          Create draft procurement request according to document workflow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Requester Type</Label>
            <Input
              value={requesterType}
              onChange={(event) => setRequesterType(event.target.value)}
            />
          </div>

          <div>
            <Label>Customer Name</Label>
            <Input
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </div>

          <div>
            <Label>Procurement Category</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setProcurementTypeId("");
              }}
              disabled={categoriesQuery.isLoading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={categoriesQuery.isLoading ? "Loading categories..." : "Select category"} />
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

          <div>
            <Label>Procurement Type</Label>
            <Select
              value={procurementTypeId}
              onValueChange={setProcurementTypeId}
              disabled={!categoryId || typesQuery.isLoading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue
                  placeholder={
                    !categoryId
                      ? "Select category first"
                      : typesQuery.isLoading
                        ? "Loading types..."
                        : "Select type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letter Scan Attachment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Upload or scan letter</Label>
            <Input
              key={scanInputKey}
              type="file"
              accept=".pdf,image/*"
              capture="environment"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);

                if (files.length === 0) return;

                setAttachments((current) => [
                  ...current,
                  ...files.map((file) =>
                    file.type.startsWith("image/")
                      ? new File(
                          [file],
                          `scanned-letter-${Date.now()}-${file.name}`,
                          { type: file.type }
                        )
                      : file
                  ),
                ]);

                setScanInputKey((current) => current + 1);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Use this single field to upload an existing PDF/image or scan using camera on supported devices.
            </p>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Button disabled={createMutation.isPending}>
        {createMutation.isPending ? "Saving..." : "Save Request"}
      </Button>
    </form>
  );
}
