import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoveSafe - Multisig Wallet",
  description: "Secure multisig wallet for Movement Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-slate-950`}>
        <ToastProvider>
          <WalletProvider>
            <div className="min-h-screen lg:grid lg:grid-cols-[auto_1fr]">
              <Sidebar />
              <main className="min-w-0 p-4 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-all duration-300">
                {children}
              </main>
            </div>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
