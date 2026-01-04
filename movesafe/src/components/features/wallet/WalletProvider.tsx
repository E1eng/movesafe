'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { ReactNode, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          console.warn('Wallet adapter error:', error);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
  );
}
