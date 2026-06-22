"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import api from "@/lib/api";

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "om", label: "Afaan Oromoo" },
  { code: "am", label: "አማርኛ" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];
export type TranslationResources = Record<SupportedLanguage, Record<string, string>>;

const EMPTY_RESOURCES: TranslationResources = {
  en: {},
  om: {},
  am: {},
};

let resourcesPromise: Promise<Partial<TranslationResources>> | null = null;

export function isSupportedLanguage(language?: string | null): language is SupportedLanguage {
  return supportedLanguages.some((item) => item.code === language);
}

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem("language");
  return isSupportedLanguage(stored) ? stored : "en";
}

function applyDatabaseResources(resources: Partial<TranslationResources>) {
  supportedLanguages.forEach((language) => {
    const bundle = resources[language.code] ?? {};
    i18n.addResourceBundle(language.code, "translation", bundle, true, true);
  });
}

export async function loadDatabaseTranslations(force = false) {
  if (!force && resourcesPromise) return resourcesPromise;

  resourcesPromise = api
    .get("/translations/resources")
    .then(({ data }) => {
      const resources = (data?.data ?? EMPTY_RESOURCES) as Partial<TranslationResources>;
      applyDatabaseResources(resources);
      i18n.emit("loaded", resources);
      return resources;
    })
    .catch((error) => {
      if (force) resourcesPromise = null;
      throw error;
    });

  return resourcesPromise;
}

export async function changeDatabaseLanguage(language: string) {
  const nextLanguage: SupportedLanguage = isSupportedLanguage(language) ? language : "en";

  await loadDatabaseTranslations();
  await i18n.changeLanguage(nextLanguage);

  if (typeof window !== "undefined") {
    window.localStorage.setItem("language", nextLanguage);
    window.dispatchEvent(new CustomEvent("app-language-changed", { detail: nextLanguage }));
  }
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: {} },
        om: { translation: {} },
        am: { translation: {} },
      },
      lng: getStoredLanguage(),
      fallbackLng: false,
      supportedLngs: supportedLanguages.map((language) => language.code),
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage"],
        lookupLocalStorage: "language",
        caches: ["localStorage"],
      },
      returnNull: false,
      returnEmptyString: false,
    });
}

void loadDatabaseTranslations()
  .then(() => i18n.changeLanguage(getStoredLanguage()))
  .catch(() => {
    // Database is the translation source. Keys render until the API becomes available.
  });

export default i18n;
