import { motion } from 'framer-motion';
import { Inbox, Plus } from 'lucide-react';
import { Ed25519PublicKey } from '@aptos-labs/ts-sdk';
import { TransactionQueueItem } from '@/components/features/transaction/TransactionQueueItem';
import { ExtendedTransaction } from '@/types/dashboard';
import { Safe } from '@/lib/supabase';

interface TransactionQueueProps {
    transactions: ExtendedTransaction[];
    safe: Safe;
    userAddress: string | undefined;
    userPubKey: string | undefined;
    signingTxId: string | null;
    executingTxId: string | null;
    onSign: (tx: ExtendedTransaction) => void;
    onExecute: (tx: ExtendedTransaction) => void;
    onDiscard: (tx: ExtendedTransaction) => void;
    onNewTransaction: () => void;
}

export function TransactionQueue({
    transactions, safe, userAddress, userPubKey,
    signingTxId, executingTxId,
    onSign, onExecute, onDiscard, onNewTransaction
}: TransactionQueueProps) {
    return (
        <motion.div
            key="queue"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4 max-w-3xl"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction Queue</h3>
                <span className="text-xs font-mono px-2 py-1 bg-zinc-900 rounded text-zinc-400">
                    Threshold: {safe.threshold} / {safe.owners.length}
                </span>
            </div>

            {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-700 rounded-3xl bg-gradient-to-b from-zinc-900/50 to-zinc-950/50">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
                        <Inbox className="w-10 h-10 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                    <p className="text-zinc-400 text-sm text-center max-w-xs mb-6">No pending transactions in the queue. Create one to get started.</p>
                    <button
                        onClick={onNewTransaction}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        New Transaction
                    </button>
                </div>
            ) : (
                transactions.map(tx => {
                    const hasSigned = tx.signatures?.some((s) => {
                        const cleanSigSigner = s.signer_address.toLowerCase().replace(/^0x/, '');
                        const cleanUserPub = (userPubKey || '').replace(/^0x/, '');
                        return cleanSigSigner === cleanUserPub;
                    });

                    // Check ownership by comparing public keys
                    const isOwner = safe.owners.some(ownerPubKey => {
                        const cleanOwner = ownerPubKey.toLowerCase().replace(/^0x/, '');
                        const cleanUserPub = (userPubKey || '').replace(/^0x/, '');
                        return cleanOwner === cleanUserPub;
                    });

                    return (
                        <TransactionQueueItem
                            key={tx.id}
                            transaction={tx}
                            signatures={tx.signatures || []}
                            threshold={safe.threshold}
                            canSign={isOwner && !hasSigned}
                            canExecute={isOwner}
                            onSign={() => onSign(tx)}
                            onExecute={() => onExecute(tx)}
                            onDiscard={() => onDiscard(tx)}
                            signingTxId={signingTxId}
                            executingTxId={executingTxId}
                        />
                    );
                })
            )}
        </motion.div>
    );
}
