'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Shield, Users, ArrowLeft, Check, Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { toast } from 'sonner';
import { WalletSelector } from '@/components/features/wallet/WalletSelector';
import { useState as useWalletSelectorState } from 'react';

export default function JoinDraftSafePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const draftId = String(params?.id || '');
    const joinToken = searchParams.get('t') || '';

    const { connected, account } = useWallet();

    const [draft, setDraft] = useState<SafeDraft | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);

    const connectedPubKey = useMemo(() => {
        if (!account?.publicKey) return null;
        return account.publicKey.toString().toLowerCase();
    }, [account?.publicKey]);

    const alreadyOwner = useMemo(() => {
        if (!connectedPubKey || !draft?.owners) return false;
        return draft.owners.map((o) => String(o).toLowerCase()).includes(connectedPubKey);
    }, [connectedPubKey, draft?.owners]);

    const isFull = useMemo(() => {
        if (!draft) return false;
        return (draft.owners?.length ?? 0) >= draft.owner_limit;
    }, [draft]);

    const isJoinable = useMemo(() => {
        return !!draft && draft.status === 'DRAFT' && !!joinToken && !alreadyOwner && !isFull && connected;
    }, [draft, joinToken, alreadyOwner, isFull, connected]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('safe_drafts')
                    .select('*')
                    .eq('id', draftId)
                    .single();

                if (error) throw error;
                setDraft(data as SafeDraft);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Failed to load draft');
            } finally {
                setLoading(false);
            }
        };

        if (draftId) void load();
    }, [draftId]);

    const handleJoin = async () => {
        if (!connectedPubKey || !draft || !joinToken) return;

        setJoining(true);
        setError(null);
        try {
            const { error } = await supabase.rpc('join_safe_draft', {
                draft_id: draft.id,
                join_token: joinToken,
                owner_pubkey: connectedPubKey,
            });

            if (error) throw error;
            toast.success('Successfully joined!');
            router.push(`/draft/${draft.id}`);
        } catch (e: unknown) {
            const err = e as Error;
            setError(err?.message || 'Failed to join');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
        );
    }

    if (!draft) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-black text-white p-8">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-92x92.png" alt="MoveSafe" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-2">Draft Not Found</h3>
                <p className="text-zinc-500 mb-6">{error || 'This draft may have been deleted.'}</p>
                <button
                    onClick={() => router.push('/select')}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                >
                    Back to Safes
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 bg-black text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <button
                    onClick={() => router.push('/select')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group"
                >
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Back</span>
                </button>

                <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center mb-4 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icon-92x92.png" alt="MoveSafe" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Join Safe</h1>
                    <p className="text-zinc-400">You&apos;ve been invited to join a multisig safe</p>
                </div>
            </div>

            {/* Safe Info Card */}
            <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 mb-6">
                <h3 className="font-bold text-lg mb-3">{draft.name}</h3>
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300">{draft.threshold} signatures required</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                        <span className="text-xs font-medium text-zinc-300">
                            {draft.owners?.length || 0}/{draft.owner_limit} joined
                        </span>
                    </div>
                    {draft.status !== 'DRAFT' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <span className="text-xs font-medium text-amber-400">{draft.status}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status/Action */}
            <div className="flex-1 flex flex-col justify-center">
                {!connected ? (
                    <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <Wallet className="w-10 h-10 mx-auto mb-3 text-blue-400" />
                        <p className="text-sm text-blue-300 mb-4">
                            Connect your wallet to join this safe.
                        </p>
                        <button
                            onClick={() => setWalletSelectorOpen(true)}
                            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            Connect Wallet
                        </button>
                        <WalletSelector isOpen={walletSelectorOpen} onClose={() => setWalletSelectorOpen(false)} />
                    </div>
                ) : alreadyOwner ? (
                    <div className="p-5 rounded-3xl bg-green-500/10 border border-green-500/20 text-center">
                        <Check className="w-10 h-10 mx-auto mb-3 text-green-400" />
                        <p className="text-sm text-green-300 font-medium mb-4">
                            You&apos;re already an owner of this safe!
                        </p>
                        <button
                            onClick={() => router.push(`/draft/${draft.id}`)}
                            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            View Draft
                        </button>
                    </div>
                ) : isFull ? (
                    <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-sm text-amber-300">
                            This safe has reached its owner limit.
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={!isJoinable || joining}
                        className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {joining && <Loader2 className="w-4 h-4 animate-spin" />}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icon-92x92.png" alt="" className="w-5 h-5 rounded" />
                        {joining ? 'Joining...' : 'Join as Owner'}
                    </button>
                )}

                {error && (
                    <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
