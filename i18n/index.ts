"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/locales/en";
import om from "@/i18n/locales/om";
import am from "@/i18n/locales/am";

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "om", label: "Afaan Oromoo" },
  { code: "am", label: "አማርኛ" },
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        om: { translation: om },
        am: { translation: am },
      },
      fallbackLng: "en",
      supportedLngs: supportedLanguages.map((language) => language.code),
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "language",
        caches: ["localStorage"],
      },
    });
}

export default i18n;
