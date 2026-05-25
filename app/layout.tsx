import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TicketCheck, LayoutDashboard, Plus } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
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
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                <TicketCheck className="h-4 w-4 text-white" />
              </div>
              TicketSupport
            </a>
            <div className="flex items-center gap-2">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-muted hover:text-gray-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                Nuevo ticket
              </a>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
