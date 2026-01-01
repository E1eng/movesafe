'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Plus, Shield, Search, Loader2, ArrowRight, Wallet } from 'lucide-react';
import { supabase, Safe } from '@/lib/supabase';
import { CreateSafeModal } from '@/components/features/safe/CreateSafeModal';
import { useRouter } from 'next/navigation';

interface SafeSelectionViewProps {
    onSelectSafe: (address: string) => void;
}

export function SafeSelectionView({ onSelectSafe }: SafeSelectionViewProps) {
    const { account } = useWallet();
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

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="h-full flex flex-col p-6 pt-safe md:p-10 bg-black relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                    Welcome Back
                </h1>
                <p className="text-zinc-400 mt-2">Select a treasury to manage</p>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">
                    {/* Main Grid: Safes */}
                    <div className="flex-1 overflow-y-auto pr-2 overscroll-contain pb-safe order-2 md:order-1">
                        {safes.length > 0 ? (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {safes.map((safe) => (
                                    <motion.button
                                        key={safe.address}
                                        variants={item}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSelectSafe(safe.address)}
                                        className="group relative p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left flex flex-col justify-between min-h-[160px]"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-indigo-500/20 group-hover:border-blue-500/30 transition-all">
                                                <Wallet className="w-6 h-6 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-1 truncate">{safe.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                                                    {safe.threshold}/{safe.owners.length} SIGS
                                                </span>
                                                <span className="text-xs text-zinc-500 font-mono truncate max-w-[80px]">
                                                    {safe.address.slice(0, 6)}...
                                                </span>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                                <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-4">
                                    <Shield className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No Safes Found</h3>
                                <p className="text-zinc-500 max-w-xs mx-auto">
                                    You aren't associated with any multi-signature safes yet.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Actions */}
                    <div className="w-full md:w-64 grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-4 order-1 md:order-2 shrink-0">
                        <div className="col-span-2 text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Actions</div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCreateOpen(true)}
                            className="p-4 md:p-5 rounded-3xl bg-white text-black flex flex-row md:flex-col items-center md:items-start gap-3 shadow-lg shadow-white/5 hover:bg-zinc-100 transition-colors"
                        >
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4 md:w-5 md:h-5 text-black" />
                            </div>
                            <div className="text-left min-w-0">
                                <div className="font-bold text-sm md:text-lg truncate">Create New</div>
                                <div className="text-[10px] md:text-xs text-zinc-500 font-medium truncate">Deploy a safe</div>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/drafts')}
                            className="p-4 md:p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-row md:flex-col items-center md:items-start gap-3 hover:bg-zinc-800 transition-colors"
                        >
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                                <Shield className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                            <div className="text-left min-w-0">
                                <div className="font-bold text-white text-sm md:text-lg truncate">Drafts</div>
                                <div className="text-[10px] md:text-xs text-zinc-500 font-medium truncate">View pending</div>
                            </div>
                        </motion.button>
                    </div>
                </div>
            )}

            <CreateSafeModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    );
}
