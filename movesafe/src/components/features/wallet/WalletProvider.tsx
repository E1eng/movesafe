'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { ReactNode, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AptosWalletAdapterProvider
        autoConnect={true}
        optInWallets={[]}
        disableTelemetry={true}
        onError={(error) => {
          // Silent catch for adapter errors to keep console clean
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
  );
}
