'use client';

import { useEffect, Suspense } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SafeDashboardView } from '@/components/views/SafeDashboardView';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
    const { connected } = useWallet();
    const router = useRouter();
    const searchParams = useSearchParams();
    const safeAddress = searchParams.get('safe');

    useEffect(() => {
        if (!connected) {
            router.push('/');
        } else if (!safeAddress) {
            router.push('/select');
        }
    }, [connected, safeAddress, router]);

    if (!connected || !safeAddress) return null;

    return (
        <SafeDashboardView
            safeAddress={safeAddress}
            onBack={() => router.push('/select')}
        />
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-zinc-500" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
