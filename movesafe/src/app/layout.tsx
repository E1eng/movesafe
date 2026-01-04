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
      <body className={`${inter.className} antialiased bg-zinc-800 text-white min-h-screen flex items-center justify-center overflow-hidden relative selection:bg-zinc-600 selection:text-white`}>
        <ToastProvider>
          <WalletProvider>
            {/* Layered Grey App Container */}
            {/* Mobile: Full Screen zinc-950 */}
            {/* Desktop: Floating Card on zinc-800 stage */}
            <div className="w-full h-[100dvh] bg-zinc-950 shadow-none border-none rounded-none overflow-hidden relative flex flex-col md:w-[960px] md:h-[640px] md:max-h-[85vh] md:border md:border-zinc-700 md:rounded-[32px] md:shadow-2xl md:ring-1 md:ring-white/5">
              {children}
            </div>
          </WalletProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
