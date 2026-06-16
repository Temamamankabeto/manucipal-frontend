"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supportedLanguages } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = supportedLanguages.find((language) => language.code === i18n.language) ?? supportedLanguages[0];

  async function changeLanguage(language: string) {
    await i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label={t("language")}>
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem key={language.code} onClick={() => changeLanguage(language.code)}>
            {language.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
