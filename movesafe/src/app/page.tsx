'use client';

import { useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { ConnectWalletView } from '@/components/views/ConnectWalletView';

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      router.push('/select');
    }
  }, [connected, router]);

  return <ConnectWalletView />;
}
