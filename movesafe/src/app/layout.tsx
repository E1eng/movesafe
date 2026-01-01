import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/features/wallet/WalletProvider";
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
            {/* Hybrid App Container */}
            {/* Mobile (Default): Full Screen, No Borders */}
            {/* Desktop (md): Fixed 960x640 (Original), Floating Card Style */}
            <div className="w-full h-[100dvh] bg-black shadow-none border-none rounded-none overflow-hidden relative flex flex-col md:w-[960px] md:h-[640px] md:max-h-[85vh] md:border md:border-zinc-800 md:rounded-[32px] md:shadow-2xl md:ring-1 md:ring-white/5 md:backdrop-blur-3xl">
              {children}
            </div>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
