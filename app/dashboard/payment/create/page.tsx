"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePaymentRequest } from "@/hooks/payment/use-payment";
import { usePaymentCategories, usePaymentTypes } from "@/hooks/payment/use-payment-master-data";

export default function CreatePaymentPage() {
  const router = useRouter();
  const [requestingEntity, setRequestingEntity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);

  const categoriesQuery = usePaymentCategories({ per_page: 100 });
  const typesQuery = usePaymentTypes({ category_id: categoryId, per_page: 100 });
  const categories = categoriesQuery.data?.data ?? [];
  const types = typesQuery.data?.data ?? [];

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === categoryId),
    [categories, categoryId],
  );
  const selectedType = useMemo(
    () => types.find((type) => String(type.id) === typeId),
    [types, typeId],
  );

  const createMutation = useCreatePaymentRequest(() => {
    toast.success("Payment request created");
    router.push("/dashboard/payment");
  });

  function submit(event: FormEvent) {
    event.preventDefault();

    createMutation.mutate({
      requester_type: "Internal",
      requesting_entity: requestingEntity,
      request_type: selectedType?.name ?? "Payment Request",
      payment_category_id: categoryId,
      payment_type_id: typeId,
      payment_category: selectedCategory?.name ?? "General Payment",
      title: requestingEntity || selectedType?.name || "Payment Request",
      description,
      attachments,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Payment Request</h1>
        <p className="text-sm text-muted-foreground">
          Create the request first. Receiver is selected during submit on the detail page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Request Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Requesting Entity</Label>
            <Input
              required
              value={requestingEntity}
              onChange={(event) => setRequestingEntity(event.target.value)}
              placeholder="Office / department / organization"
            />
          </div>

          <div>
            <Label>Payment Category</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setTypeId("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment category" />
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
            <Label>Payment Type</Label>
            <Select value={typeId} onValueChange={setTypeId} required disabled={!categoryId}>
              <SelectTrigger>
                <SelectValue placeholder={categoryId ? "Select payment type" : "Select category first"} />
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
            <Label>Payment Purpose / Justification</Label>
            <Textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write payment reason / justification"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Upload or scan payment documents</Label>
            <Input
              key={fileKey}
              type="file"
              accept=".pdf,image/*"
              capture="environment"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length === 0) return;
                setAttachments((current) => [...current, ...files]);
                setFileKey((current) => current + 1);
              }}
            />
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button disabled={createMutation.isPending || !categoryId || !typeId}>
        {createMutation.isPending ? "Saving..." : "Save Draft"}
      </Button>
    </form>
  );
}
