import type { Metadata } from "next";
import { Familjen_Grotesk, Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

const display = Familjen_Grotesk({ subsets: ["latin"], weight: ["500"], variable: "--font-display" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = { title: "SpiroAI" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${geist.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
