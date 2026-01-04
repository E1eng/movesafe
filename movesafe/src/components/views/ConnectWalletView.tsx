'use client';

import { motion } from 'framer-motion';
import { WalletSelector } from '@/components/features/wallet/WalletSelector';
import { Shield } from 'lucide-react';
import { useState } from 'react';

export function ConnectWalletView() {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-3xl bg-transparent flex items-center justify-center shadow-2xl shadow-blue-500/20 overflow-hidden"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-92x92.png" alt="MoveSafe Logo" className="w-full h-full object-cover" />
                </motion.div>

                <div className="space-y-2">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold text-white tracking-tight"
                    >
                        MoveSafe
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400"
                    >
                        Secure Multisig Treasury<br />for Movement Network
                    </motion.p>
                </div>

                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setIsSelectorOpen(true)}
                    className="w-full max-w-xs py-4 px-6 bg-white text-black font-bold rounded-2xl text-lg hover:bg-zinc-200 transition-colors"
                >
                    Connect Wallet
                </motion.button>
            </div>

            <WalletSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
            />
        </>
    );
}
