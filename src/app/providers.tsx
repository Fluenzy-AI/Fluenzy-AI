"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      storageKey="fluenzy-theme"
      disableTransitionOnChange={false}
    >
      <SessionProvider>{children}</SessionProvider>
    </NextThemesProvider>
  );
}
