'use client';

import { useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { SafeSelectionView } from '@/components/views/SafeSelectionView';

export default function SelectPage() {
    const { connected } = useWallet();
    const router = useRouter();

    useEffect(() => {
        if (!connected) {
            router.push('/');
        }
    }, [connected, router]);

    const handleSelectSafe = (address: string) => {
        router.push(`/dashboard?safe=${address}`);
    };

    return <SafeSelectionView onSelectSafe={handleSelectSafe} />;
}
