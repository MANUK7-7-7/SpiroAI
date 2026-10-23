import type { Metadata } from "next";
import { Familjen_Grotesk, Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

const display = Familjen_Grotesk({ subsets: ["latin"], weight: ["500"], variable: "--font-display" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = { title: "SpiroAI" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await syncStore();
  const locale = await getLocale();
  return (
    <html lang={locale === "es" ? "es-AR" : "en"} className={`${display.variable} ${geist.variable} ${mono.variable}`}>
      <body>
        <I18nProvider locale={locale} messages={getMessages(locale)}>{children}</I18nProvider>
      </body>
    </html>
  );
}
