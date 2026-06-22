"use client";

import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { DatabaseTranslationProvider } from "@/providers/database-translation-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <ReactQueryProvider>
        <DatabaseTranslationProvider>{children}</DatabaseTranslationProvider>
        <Toaster richColors position="top-right" />
      </ReactQueryProvider>
    </ReduxProvider>
  );
}

export default AppProviders;
