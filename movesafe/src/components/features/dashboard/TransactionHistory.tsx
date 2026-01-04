import { motion } from 'framer-motion';
import { Download, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatAmount, getTransferDetails } from '@/lib/format';
import { ExtendedTransaction } from '@/types/dashboard';

interface TransactionHistoryProps {
    history: ExtendedTransaction[];
    safeAddress: string;
    movePrice: number | null;
}

export function TransactionHistory({ history, safeAddress, movePrice }: TransactionHistoryProps) {
    return (
        <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4 max-w-3xl"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                {history.length > 0 && (
                    <button
                        onClick={() => {
                            // Generate CSV
                            const headers = ['Date', 'Type', 'Amount (MOVE)', 'Recipient', 'Tx Hash', 'Memo'];
                            const rows = history.map(tx => {
                                const { recipient, amount } = getTransferDetails(tx.payload);
                                const formattedAmount = formatAmount(amount);
                                const date = tx.executed_at ? new Date(tx.executed_at).toISOString().split('T')[0] : 'N/A';
                                return [date, 'Send', formattedAmount, recipient, tx.tx_hash || '', tx.memo || ''].join(',');
                            });
                            const csv = [headers.join(','), ...rows].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `movesafe-history-${safeAddress.slice(0, 8)}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success('History exported!');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-gradient-to-b from-zinc-900/50 to-zinc-950/50">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
                        <Clock className="w-10 h-10 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No history yet</h3>
                    <p className="text-zinc-400 text-sm text-center max-w-xs">Executed transactions will appear here. Start by creating and executing your first transaction.</p>
                </div>
            ) : (
                history.map(tx => {
                    const { recipient, amount } = getTransferDetails(tx.payload);

                    return (
                        <div key={tx.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-white">
                                    Sent {formatAmount(amount)} MOVE
                                    {movePrice && (
                                        <span className="ml-2 text-xs font-normal text-zinc-400">
                                            (≈ ${(parseFloat(amount) / 100000000 * movePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-zinc-400 flex items-center gap-2">
                                    To: <code className="font-mono bg-zinc-800 px-1 py-0.5 rounded">{recipient.slice(0, 8)}...{recipient.slice(-6)}</code>
                                </div>
                                {tx.memo && (
                                    <div className="text-xs text-zinc-400 mt-1 italic">&quot;{tx.memo}&quot;</div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-zinc-400">
                                    {tx.executed_at ? new Date(tx.executed_at).toLocaleDateString() : 'N/A'}
                                </div>
                                {tx.tx_hash && (
                                    <a
                                        href={`https://explorer.movementnetwork.xyz/txn/${tx.tx_hash}?network=bardock+testnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:underline"
                                    >
                                        View →
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </motion.div>
    );
}
