'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Plus, Shield, Loader2, ArrowRight, Wallet, LogOut, FileClock } from 'lucide-react';
import { supabase, Safe } from '@/lib/supabase';
import { CreateSafeModal } from '@/components/features/safe/CreateSafeModal';
import { useRouter } from 'next/navigation';

interface SafeSelectionViewProps {
    onSelectSafe: (address: string) => void;
}

export function SafeSelectionView({ onSelectSafe }: SafeSelectionViewProps) {
    const { account, disconnect } = useWallet();
    const router = useRouter();
    const [safes, setSafes] = useState<Safe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const connectedPubKey = useMemo(() => {
        return account?.publicKey?.toString().toLowerCase();
    }, [account]);

    useEffect(() => {
        const loadSafes = async () => {
            if (!connectedPubKey) return;
            setLoading(true);
            try {
                const { data } = await supabase.from('safes').select('*');
                const owned = (data as Safe[] || []).filter(s =>
                    s.owners.some(o => o.toLowerCase() === connectedPubKey)
                );

                // Local storage merge
                try {
                    const local = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
                    const localOwned = local.filter((s: Safe) =>
                        s.owners.some(o => o.toLowerCase() === connectedPubKey)
                    );

                    const merged = [...owned];
                    localOwned.forEach((l: Safe) => {
                        if (!merged.find(m => m.address === l.address)) merged.push(l);
                    });
                    setSafes(merged);
                } catch {
                    setSafes(owned);
                }
            } finally {
                setLoading(false);
            }
        };
        loadSafes();
    }, [connectedPubKey]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };



    return (
        <div className="h-full flex flex-col p-6 pt-safe md:p-10 bg-zinc-950 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-zinc-400 mt-2">Select a treasury to manage</p>
                </div>

                <button
                    onClick={() => disconnect()}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200 group shrink-0 cursor-pointer active:scale-95"
                >
                    <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-red-400 transition-colors" />
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-red-400 transition-colors hidden sm:inline">Logout</span>
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
                    {/* Main Grid: Safes */}
                    <div className="flex-1 overflow-y-auto pr-2 pt-2 overscroll-contain pb-safe order-2 md:order-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {safes.length > 0 ? (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {safes.map((safe) => (
                                    <button
                                        key={safe.address}
                                        onClick={() => onSelectSafe(safe.address)}
                                        className="group relative p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] cursor-pointer shadow-lg shadow-black/5"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-indigo-500/20 group-hover:border-blue-500/30 transition-all duration-300">
                                                <Wallet className="w-6 h-6 text-zinc-400 group-hover:text-blue-400 transition-colors duration-300" />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                                                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-1 truncate">{safe.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-zinc-400 font-mono truncate max-w-[80px]">
                                                    {safe.address.slice(0, 6)}...
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 rounded-3xl border border-dashed border-zinc-800">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
                                    <Shield className="w-10 h-10 text-zinc-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No Safes Found</h3>
                                <p className="text-zinc-400 max-w-xs mx-auto mb-6">
                                    You aren&apos;t associated with any multi-signature safes yet. Create your first safe to get started.
                                </p>
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Safe
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Actions */}
                    <div className="w-full md:w-64 grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-4 order-1 md:order-2 shrink-0">
                        <div className="col-span-2 text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Actions</div>

                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="p-4 md:p-5 rounded-3xl bg-white text-black flex flex-row md:flex-col items-center md:items-start gap-3 shadow-lg shadow-white/5 hover:bg-zinc-200 transition-all duration-300 cursor-pointer active:scale-95"
                        >
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4 md:w-5 md:h-5 text-black" />
                            </div>
                            <div className="text-left min-w-0">
                                <div className="font-bold text-sm md:text-lg truncate">Create New</div>
                                <div className="text-[10px] md:text-xs text-zinc-400 font-medium truncate">Deploy a safe</div>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/drafts')}
                            className="p-4 md:p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-row md:flex-col items-center md:items-start gap-3 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300 cursor-pointer active:scale-95"
                        >
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                                <FileClock className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-left min-w-0">
                                <div className="font-bold text-white text-sm md:text-lg truncate">Drafts</div>
                                <div className="text-[10px] md:text-xs text-zinc-400 font-medium truncate">View pending</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <CreateSafeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    );
}
