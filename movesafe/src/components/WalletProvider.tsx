'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { AvailableWallets } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { ReactNode } from 'react';

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={[
        'Petra' as AvailableWallets,
        'Nightly' as AvailableWallets,
        'Pontem Wallet' as AvailableWallets,
        'OKX Wallet' as AvailableWallets,
        'Backpack' as AvailableWallets,
        'MSafe' as AvailableWallets,
        'Bitget Wallet' as AvailableWallets,
        'Gate Wallet' as AvailableWallets,
        'Cosmostation Wallet' as AvailableWallets,
      ]}
      dappConfig={{
        network: Network.TESTNET,
      }}
      onError={(error) => {
        // Ignore wallet fetch errors - they're usually network-related
        console.warn('Wallet adapter error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
