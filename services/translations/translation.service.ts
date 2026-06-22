import api from "@/lib/api";

export type Translation = {
  id: number;
  language: string;
  translation_key: string;
  translation_value: string;
  created_at?: string;
  updated_at?: string;
};

export type TranslationPayload = {
  language: string;
  translation_key: string;
  translation_value: string;
};

export type TranslationListParams = {
  language?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export const translationService = {
  async resources() {
    const { data } = await api.get("/translations/resources");
    return data;
  },
  async list(params?: TranslationListParams) {
    const { data } = await api.get("/admin/translations", { params });
    return data;
  },
  async create(payload: TranslationPayload) {
    const { data } = await api.post("/admin/translations", payload);
    return data;
  },
  async update(id: number, payload: TranslationPayload) {
    const { data } = await api.put(`/admin/translations/${id}`, payload);
    return data;
  },
  async remove(id: number) {
    const { data } = await api.delete(`/admin/translations/${id}`);
    return data;
  },
};
