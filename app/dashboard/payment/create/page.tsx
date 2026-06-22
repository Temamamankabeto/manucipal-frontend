"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    toast.success(t("payment_request_created"));
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
        <h1 className="text-2xl font-bold">{t("create_payment_request")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("create_payment_request_description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("payment_request_information")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>{t("requesting_entity")}</Label>
            <Input
              required
              value={requestingEntity}
              onChange={(event) => setRequestingEntity(event.target.value)}
              placeholder={t("office_department_organization")}
            />
          </div>

          <div>
            <Label>{t("payment_category")}</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setTypeId("");
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_payment_category")} />
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
            <Label>{t("payment_type")}</Label>
            <Select value={typeId} onValueChange={setTypeId} required disabled={!categoryId}>
              <SelectTrigger>
                <SelectValue placeholder={categoryId ? t("select_payment_type") : t("select_category_first")} />
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
            <Label>{t("payment_purpose_justification")}</Label>
            <Textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("write_payment_reason_justification")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("upload_or_scan_payment_documents")}</Label>
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
                    {t("remove")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button disabled={createMutation.isPending || !categoryId || !typeId}>
        {createMutation.isPending ? t("saving") : t("save_draft")}
      </Button>
    </form>
  );
}
