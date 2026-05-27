import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TicketCheck } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { AuthStatus } from "@/components/auth-status";
import { NuevoTicketButton } from "@/components/nuevo-ticket-button";
import { HeaderNav } from "@/components/header-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soporte Técnico IA",
  description: "Sistema multi-agente de soporte técnico con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AnimatedBackground />
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                <TicketCheck className="h-4 w-4 text-white" />
              </div>
              TicketSupport
            </a>
            <div className="flex items-center gap-2">
              <HeaderNav />
              <NuevoTicketButton />
              <AuthStatus />
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
