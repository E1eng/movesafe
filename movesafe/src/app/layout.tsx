import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MoveSafe",
  description: "Secure Multisig for Movement Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-zinc-950 text-white min-h-screen flex items-center justify-center overflow-hidden relative selection:bg-zinc-800 selection:text-white`}>
        {/* Radial Gradient Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950 pointer-events-none -z-10" />

        <ToastProvider>
          <WalletProvider>
            {/* Floating App Container - LANDSCAPE MODE */}
            <div className="w-[960px] h-[640px] bg-black border border-zinc-800/80 rounded-[32px] shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/5 backdrop-blur-3xl">
              {children}
            </div>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
