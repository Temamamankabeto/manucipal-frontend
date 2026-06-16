"use client";

import { FormEvent, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supportedLanguages } from "@/i18n";
import { useCreateTranslationMutation, useDeleteTranslationMutation, useTranslationsQuery, useUpdateTranslationMutation } from "@/hooks/translation/use-translations";
import type { Translation, TranslationPayload } from "@/services/translations/translation.service";

const emptyForm: TranslationPayload = { language: "en", translation_key: "", translation_value: "" };

export default function TranslationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Translation | null>(null);
  const [form, setForm] = useState<TranslationPayload>(emptyForm);

  const query = useTranslationsQuery({ page, per_page: 15, search, language: language === "all" ? undefined : language });
  const rows: Translation[] = query.data?.data ?? [];
  const meta = query.data?.meta;

  const close = () => { setOpen(false); setEditing(null); setForm(emptyForm); };
  const create = useCreateTranslationMutation(() => { toast.success("Translation created"); close(); });
  const update = useUpdateTranslationMutation(() => { toast.success("Translation updated"); close(); });
  const remove = useDeleteTranslationMutation();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (editing) {
      update.mutate({ id: editing.id, payload: form });
      return;
    }
    create.mutate(form);
  }

  function edit(row: Translation) {
    setEditing(row);
    setForm({ language: row.language, translation_key: row.translation_key, translation_value: row.translation_value });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("translation_management")}</h1>
          <p className="text-sm text-muted-foreground">{t("translation_description")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />{t("add_translation")}</Button>
      </div>

      <div className="grid gap-3 rounded-md border bg-white p-3 md:grid-cols-3">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("search")} />
        <Select value={language} onValueChange={(value) => { setLanguage(value); setPage(1); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_languages")}</SelectItem>
            {supportedLanguages.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("language")}</TableHead>
              <TableHead>{t("translation_key")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.language}</TableCell>
                <TableCell className="font-medium">{row.translation_key}</TableCell>
                <TableCell>{row.translation_value}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => edit(row)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(row.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t("no_records")}</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={(meta?.current_page ?? 1) <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit_translation") : t("add_translation")}</DialogTitle>
            <DialogDescription>{t("translation_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>{t("language")}</Label>
              <Select value={form.language} onValueChange={(value) => setForm((current) => ({ ...current, language: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{supportedLanguages.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("translation_key")}</Label><Input required value={form.translation_key} onChange={(e) => setForm((current) => ({ ...current, translation_key: e.target.value }))} /></div>
            <div><Label>{t("value")}</Label><Textarea required value={form.translation_value} onChange={(e) => setForm((current) => ({ ...current, translation_value: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>{t("cancel")}</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>{t("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
