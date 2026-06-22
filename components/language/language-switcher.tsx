"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeDatabaseLanguage, supportedLanguages } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [loadingLanguage, setLoadingLanguage] = useState<string | null>(null);
  const current =
    supportedLanguages.find((language) => language.code === i18n.language) ?? supportedLanguages[0];

  async function changeLanguage(language: string) {
    setLoadingLanguage(language);

    try {
      await changeDatabaseLanguage(language);
    } finally {
      setLoadingLanguage(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label={t("language") || "Language"}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            disabled={Boolean(loadingLanguage)}
            onClick={() => changeLanguage(language.code)}
          >
            {loadingLanguage === language.code ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {language.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
