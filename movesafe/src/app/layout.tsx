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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black text-slate-900 dark:text-slate-50`}>
        <ToastProvider>
          <WalletProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
                <div className="max-w-6xl mx-auto w-full">
                  {children}
                </div>
              </main>
            </div>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
