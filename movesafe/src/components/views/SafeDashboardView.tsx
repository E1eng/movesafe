'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, History, CheckCircle2, Coins, Users, LogOut, X } from 'lucide-react';
import { supabase, Safe } from '@/lib/supabase';
import { NewTransactionModal } from '@/components/features/transaction/NewTransactionModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useMovePrice } from '@/hooks/useMovePrice';
import { aptos } from '@/lib/movement';
import { toast } from 'sonner';
import { assembleMultiSigAuthenticator, SignatureData } from '@/lib/multisig';
import { formatError } from '@/lib/errorMessages';
import { ExtendedTransaction, Tab } from '@/types/dashboard';

// Sub-components
import { DashboardSidebar } from '@/components/features/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader';
import { TransactionQueue } from '@/components/features/dashboard/TransactionQueue';
import { TransactionHistory } from '@/components/features/dashboard/TransactionHistory';
import { SafeAssets } from '@/components/features/dashboard/SafeAssets';
import { SafeOwners } from '@/components/features/dashboard/SafeOwners';

interface SafeDashboardViewProps {
    safeAddress: string;
    onBack: () => void;
}

export function SafeDashboardView({ safeAddress, onBack }: SafeDashboardViewProps) {
    const { account, signTransaction } = useWallet();
    const [activeTab, setActiveTab] = useState<Tab>('queue');
    const [safe, setSafe] = useState<Safe | null>(null);
    const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
    const [history, setHistory] = useState<ExtendedTransaction[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const { price: movePrice } = useMovePrice();
    const [loading, setLoading] = useState(true);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Action States
    const [signingTxId, setSigningTxId] = useState<string | null>(null);
    const [executingTxId, setExecutingTxId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            // 1. Fetch Safe Info
            const { data: safeData } = await supabase.from('safes').select('*').eq('address', safeAddress).single();
            if (safeData) setSafe(safeData);

            // 2. Fetch Transactions
            const { data: txData } = await supabase
                .from('transactions')
                .select('*, signatures(*)')
                .eq('safe_address', safeAddress)
                .neq('status', 'EXECUTED')
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            setTransactions(txData as ExtendedTransaction[] || []);

            // 3. Fetch History (Executed Transactions)
            const { data: historyData } = await supabase
                .from('transactions')
                .select('*, signatures(*)')
                .eq('safe_address', safeAddress)
                .eq('status', 'EXECUTED')
                .order('executed_at', { ascending: false })
                .limit(50);

            setHistory(historyData as ExtendedTransaction[] || []);

            // 4. Fetch Balance (MOVE)
            try {
                const resources = await aptos.getAccountResources({ accountAddress: safeAddress });
                const coinResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
                if (coinResource) {
                    const data = coinResource.data as { coin: { value: string } };
                    const val = data.coin.value;
                    setBalance(Number(val) / 100_000_000); // 8 decimals for MOVE
                }
            } catch {
                setBalance(0);
            }

        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setLoading(false);
        }
    }, [safeAddress]);

    useEffect(() => {
        setLoading(true);
        loadData();

        const sub = supabase.channel(`safe-${safeAddress}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `safe_address=eq.${safeAddress}` },
                () => loadData()
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'signatures' },
                () => loadData()
            )
            .subscribe();

        return () => { sub.unsubscribe(); };
    }, [safeAddress, loadData]);

    // --- Actions (Sign/Execute) ---
    const handleSign = async (tx: ExtendedTransaction) => {
        if (!account) return;
        setSigningTxId(tx.id);
        try {
            const payload = tx.payload;
            const buildTx = await aptos.transaction.build.simple({
                sender: safeAddress,
                data: {
                    function: payload.function as `${string}::${string}::${string}`,
                    functionArguments: payload.functionArguments,
                    typeArguments: payload.typeArguments
                },
                options: {
                    accountSequenceNumber: tx.sequence_number,
                    expireTimestamp: parseInt(payload.txOptions?.expireTimestamp || (Math.floor(Date.now() / 1000) + 3600).toString()),
                    maxGasAmount: parseInt(payload.txOptions?.maxGasAmount || '2000'),
                    gasUnitPrice: parseInt(payload.txOptions?.gasUnitPrice || '100'),
                }
            });

            const senderAuthenticator = await signTransaction({ transactionOrPayload: buildTx });

            // Extract signature
            let sigHex: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const auth = senderAuthenticator as any;

            if (auth?.authenticator?.signature) {
                sigHex = auth.authenticator.signature.toString();
            } else if (auth?.signature) {
                sigHex = auth.signature.toString();
            } else if (auth?.bcs) {
                sigHex = Buffer.from(auth.bcs).toString('hex');
            } else {
                throw new Error('Could not extract signature from wallet response');
            }

            const { error } = await supabase.from('signatures').insert({
                transaction_id: tx.id,
                signer_address: account.address.toString(),
                signature_hex: sigHex
            });
            if (error) throw error;
            toast.success("Signed successfully");
            loadData();
        } catch (e: unknown) {
            console.error("Signing failed", e);
            toast.error(`Failed to sign: ${formatError(e)}`);
        } finally {
            setSigningTxId(null);
        }
    };

    const handleExecute = async (tx: ExtendedTransaction) => {
        if (!account || !safe) return;
        setExecutingTxId(tx.id);
        try {
            const sigs: SignatureData[] = tx.signatures.map((s) => ({
                signer: s.signer_address,
                hex: s.signature_hex
            }));
            const multiSigAuth = assembleMultiSigAuthenticator(sigs, safe.owners, safe.threshold);
            const payload = tx.payload;
            const buildTx = await aptos.transaction.build.simple({
                sender: safeAddress,
                data: {
                    function: payload.function as `${string}::${string}::${string}`,
                    functionArguments: payload.functionArguments,
                    typeArguments: payload.typeArguments
                },
                options: {
                    accountSequenceNumber: tx.sequence_number,
                    expireTimestamp: parseInt(payload.txOptions?.expireTimestamp || (Math.floor(Date.now() / 1000) + 3600).toString()),
                    maxGasAmount: parseInt(payload.txOptions?.maxGasAmount || '2000'),
                    gasUnitPrice: parseInt(payload.txOptions?.gasUnitPrice || '100'),
                }
            });

            const response = await aptos.transaction.submit.simple({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                transaction: buildTx as any,
                senderAuthenticator: multiSigAuth
            });

            await aptos.waitForTransaction({ transactionHash: response.hash });
            await supabase.from('transactions').update({
                status: 'EXECUTED',
                tx_hash: response.hash,
                executed_at: new Date().toISOString()
            }).eq('id', tx.id);

            toast.success("Transaction Executed!");
            loadData();
        } catch (e: unknown) {
            console.error("Execution failed", e);
            toast.error(`Execution failed: ${formatError(e)}`);
        } finally {
            setExecutingTxId(null);
        }
    };

    const handleDiscard = (tx: ExtendedTransaction) => {
        setConfirmDeleteId(tx.id);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDeleteId) return;
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', confirmDeleteId);
            if (error) throw error;
            toast.success("Transaction discarded");
            loadData();
        } catch (e) {
            toast.error(`Failed to delete: ${formatError(e)}`);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    if (loading || !safe) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
    );

    return (
        <div className="flex h-full bg-zinc-950 text-white">
            <DashboardSidebar
                safe={safe}
                safeAddress={safeAddress}
                activeTab={activeTab}
                onSwitchTab={setActiveTab}
                onBack={onBack}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
                <DashboardHeader
                    balance={balance}
                    movePrice={movePrice}
                    onNewTransaction={() => setIsTxModalOpen(true)}
                    onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                />

                <div className="flex-1 overflow-y-auto p-4 md:p-8 overscroll-contain pb-safe">
                    <AnimatePresence mode="wait">
                        {activeTab === 'queue' && (
                            <TransactionQueue
                                transactions={transactions}
                                safe={safe}
                                userAddress={account?.address?.toString()?.toLowerCase()}
                                signingTxId={signingTxId}
                                executingTxId={executingTxId}
                                onSign={handleSign}
                                onExecute={handleExecute}
                                onDiscard={handleDiscard}
                                onNewTransaction={() => setIsTxModalOpen(true)}
                            />
                        )}

                        {activeTab === 'history' && (
                            <TransactionHistory
                                history={history}
                                safeAddress={safeAddress}
                                movePrice={movePrice}
                            />
                        )}

                        {activeTab === 'assets' && (
                            <SafeAssets
                                balance={balance}
                                movePrice={movePrice}
                            />
                        )}

                        {activeTab === 'signers' && (
                            <SafeOwners owners={safe.owners} />
                        )}
                    </AnimatePresence>
                </div>

                <NewTransactionModal
                    isOpen={isTxModalOpen}
                    onClose={() => setIsTxModalOpen(false)}
                    safeAddress={safeAddress}
                    onTransactionCreated={() => {
                        setIsTxModalOpen(false);
                        loadData();
                    }}
                />
            </div>

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Discard Transaction"
                description="Are you sure you want to discard this transaction? It will be permanently removed from the queue."
                confirmText="Discard"
                variant="danger"
            />

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col md:hidden pt-safe pb-safe"
                        >
                            <div className="p-6 pb-2 flex items-center justify-between">
                                <h2 className="font-bold text-lg">{safe?.name || 'Safe'}</h2>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 cursor-pointer">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                                <button onClick={() => { setActiveTab('queue'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800">
                                    <History className="w-5 h-5" /> Queue
                                </button>
                                <button onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800">
                                    <CheckCircle2 className="w-5 h-5" /> History
                                </button>
                                <button onClick={() => { setActiveTab('assets'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800">
                                    <Coins className="w-5 h-5" /> Assets
                                </button>
                                <button onClick={() => { setActiveTab('signers'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800">
                                    <Users className="w-5 h-5" /> Owners
                                </button>
                            </div>
                            <div className="p-6 border-t border-zinc-800">
                                <button onClick={onBack} className="flex items-center gap-3 text-red-400 font-medium cursor-pointer">
                                    <LogOut className="w-4 h-4" /> Exit
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
