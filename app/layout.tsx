import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "Manucipality Authomation",
  description: "Role-based Manucipality Authomation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
