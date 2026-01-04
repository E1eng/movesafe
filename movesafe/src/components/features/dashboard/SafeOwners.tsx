import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Ed25519PublicKey } from '@aptos-labs/ts-sdk';

interface SafeOwnersProps {
    owners: string[];
}

export function SafeOwners({ owners }: SafeOwnersProps) {
    return (
        <motion.div
            key="signers"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <h3 className="text-lg font-semibold mb-4">Safe Owners</h3>
            <div className="grid gap-3">
                {owners.map((ownerPubKey, i) => {
                    // Derive address from public key for display
                    let displayAddress = ownerPubKey;
                    try {
                        const cleanPubKey = ownerPubKey.startsWith('0x') ? ownerPubKey.slice(2) : ownerPubKey;
                        const pubKey = new Ed25519PublicKey(cleanPubKey);
                        displayAddress = pubKey.authKey().derivedAddress().toString();
                    } catch {
                        // If derivation fails, show the original value
                    }

                    return (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center font-bold text-zinc-400">
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-mono text-sm text-zinc-300">
                                    <span className="md:hidden">
                                        {displayAddress.slice(0, 10)}...{displayAddress.slice(-8)}
                                    </span>
                                    <span className="hidden md:block truncate">
                                        {displayAddress}
                                    </span>
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5">Owner</div>
                            </div>
                            <button
                                onClick={() => { navigator.clipboard.writeText(displayAddress); toast.success("Copied"); }}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
