import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { Navbar } from "@/components/Navbar";
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950`}>
        <ToastProvider>
          <WalletProvider>
            {/* Fixed Navbar */}
            <Navbar />

            {/* Main Layout with Sidebar */}
            <div className="flex pt-16">
              {/* Sidebar - hidden on mobile */}
              <div className="hidden lg:block">
                <Sidebar />
              </div>

              {/* Main Content Area */}
              <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] transition-all duration-300">
                {children}
              </main>
            </div>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
