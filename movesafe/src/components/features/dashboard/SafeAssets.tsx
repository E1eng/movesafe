import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface SafeAssetsProps {
    balance: number;
    movePrice: number | null;
}

export function SafeAssets({ balance, movePrice }: SafeAssetsProps) {
    return (
        <motion.div
            key="assets"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Coins className="w-24 h-24 text-white" />
                </div>
                <h4 className="text-zinc-400 font-medium text-sm mb-2">MOVE Token</h4>
                <div className="text-3xl font-bold mb-1">{balance.toFixed(4)} <span className="text-lg text-zinc-400">MOVE</span></div>
                {movePrice && (
                    <div className="text-sm text-zinc-400">≈ ${(balance * movePrice).toFixed(2)} USD</div>
                )}
            </div>
            {/* Placeholder for other tokens */}
            <div className="p-6 border border-dashed border-zinc-800 rounded-3xl flex items-center justify-center text-zinc-400 text-sm h-full min-h-[160px]">
                More assets coming soon...
            </div>
        </motion.div>
    );
}
