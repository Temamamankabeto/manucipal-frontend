"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getStoredLanguage, loadDatabaseTranslations } from "@/i18n";
import i18n from "@/i18n";

type DatabaseTranslationProviderProps = {
  children: ReactNode;
};

export function DatabaseTranslationProvider({ children }: DatabaseTranslationProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadDatabaseTranslations(true)
      .then(() => i18n.changeLanguage(getStoredLanguage()))
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading language...
      </div>
    );
  }

  return <>{children}</>;
}

export default DatabaseTranslationProvider;
