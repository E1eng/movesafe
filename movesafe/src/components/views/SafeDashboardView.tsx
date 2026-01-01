'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Copy, Plus, Menu, CheckCircle2,
    Wallet, Users, History, Settings, Coins, LogOut, Loader2, X
} from 'lucide-react';
import { supabase, Safe, Transaction } from '@/lib/supabase';
import { TransactionQueueItem } from '@/components/features/transaction/TransactionQueueItem';
import { NewTransactionModal } from '@/components/features/transaction/NewTransactionModal';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useMovePrice } from '@/hooks/useMovePrice';
import { aptos } from '@/lib/movement';
import { toast } from 'sonner';
import { assembleMultiSigAuthenticator, SignatureData } from '@/lib/multisig';
import { Ed25519PublicKey } from '@aptos-labs/ts-sdk';

// Extending Transaction to include signatures for the UI
interface ExtendedTransaction extends Transaction {
    signatures: any[];
}

interface SafeDashboardViewProps {
    safeAddress: string;
    onBack: () => void;
}

type Tab = 'queue' | 'history' | 'assets' | 'signers' | 'settings';

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

    // Action States
    const [signingTxId, setSigningTxId] = useState<string | null>(null);
    const [executingTxId, setExecutingTxId] = useState<string | null>(null);

    const loadData = async () => {
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

            // 3. Fetch Balance (MOVE)
            try {
                const resources = await aptos.getAccountResources({ accountAddress: safeAddress });
                const coinResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
                if (coinResource) {
                    const val = (coinResource.data as any).coin.value;
                    setBalance(Number(val) / 100_000_000); // 8 decimals for MOVE
                }
            } catch (err) {
                console.log("Balance fetch failed (safe might be new)", err);
                setBalance(0);
            }

        } catch (e) {
            console.error("Failed to load dashboard data", e);
        } finally {
            setLoading(false);
        }
    };

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
    }, [safeAddress]);

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

            // Extract signature from authenticator - handle different possible structures
            let sigHex: string;
            const auth = senderAuthenticator as any;

            if (auth?.authenticator?.signature) {
                sigHex = auth.authenticator.signature.toString();
            } else if (auth?.signature) {
                sigHex = auth.signature.toString();
            } else if (auth?.bcs) {
                // If BCS serialized, convert to hex
                sigHex = Buffer.from(auth.bcs).toString('hex');
            } else {
                // Last resort: stringify the whole thing
                console.log('senderAuthenticator structure:', JSON.stringify(auth, null, 2));
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
        } catch (e: any) {
            console.error("Signing failed", e);
            toast.error("Failed to sign: " + e.message);
        } finally {
            setSigningTxId(null);
        }
    };

    const handleExecute = async (tx: ExtendedTransaction) => {
        if (!account || !safe) return;
        setExecutingTxId(tx.id);
        try {
            const sigs: SignatureData[] = tx.signatures.map((s: any) => ({
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
                transaction: buildTx as any,
                senderAuthenticator: multiSigAuth
            });

            await aptos.waitForTransaction({ transactionHash: response.hash });
            await supabase.from('transactions').update({ status: 'EXECUTED', tx_hash: response.hash }).eq('id', tx.id);

            toast.success("Transaction Executed!");
            loadData();
        } catch (e: any) {
            console.error("Execution failed", e);
            toast.error("Execution failed: " + e.message);
        } finally {
            setExecutingTxId(null);
        }
    };

    const handleDiscard = async (tx: ExtendedTransaction) => {
        if (!confirm("Discard transaction?")) return;
        await supabase.from('transactions').delete().eq('id', tx.id);
        loadData();
    };

    if (loading || !safe) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
    );

    const NavItem = ({ id, label, icon: Icon, onSelect }: { id: Tab, label: string, icon: any, onSelect?: () => void }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                if (onSelect) onSelect();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id
                ? 'bg-white text-black font-medium shadow-md shadow-white/5'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    return (
        <div className="flex h-full bg-black text-white">
            {/* LEFT SIDEBAR - Desktop Only */}
            <div className="hidden md:flex w-[260px] flex-col border-r border-zinc-800/50 p-6 bg-zinc-950/30">
                {/* Safe Header */}
                <div className="mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="font-bold text-xl mb-1">{safe.name}</h2>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(safeAddress);
                            toast.success("Address copied");
                        }}
                        className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/50 px-2 py-1 rounded-md w-fit"
                    >
                        {safeAddress.slice(0, 8)}...{safeAddress.slice(-6)}
                        <Copy className="w-3 h-3" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 space-y-1">
                    <NavItem id="queue" label="Queue" icon={History} />
                    <NavItem id="history" label="History" icon={CheckCircle2} />
                    <NavItem id="assets" label="Assets" icon={Coins} />
                    <NavItem id="signers" label="Signers" icon={Users} />
                    {/* <NavItem id="settings" label="Settings" icon={Settings} /> */}
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 border-t border-zinc-900">
                    <button
                        onClick={onBack}
                        className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit Safe
                    </button>
                </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
                {/* Top Bar */}
                <div className="h-auto md:h-20 min-h-[5rem] flex items-center justify-between px-6 md:px-8 border-b border-zinc-800/50 z-20 bg-black/50 backdrop-blur-sm pt-safe pt-4 pb-4 md:pt-0 md:pb-0 sticky top-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div>
                            <h1 className="text-xs md:text-sm font-medium text-zinc-500">Total Balance</h1>
                            <p className="text-xl md:text-2xl font-bold tracking-tight">{balance.toLocaleString('en-US', { minimumFractionDigits: 4 })} <span className="text-sm md:text-base font-normal text-zinc-600">MOVE</span></p>
                            {movePrice && (
                                <p className="text-xs md:text-sm text-zinc-500 mt-1">
                                    ≈ ${(balance * movePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                    <span className="text-zinc-600 ml-1">(@ ${movePrice.toFixed(4)})</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsTxModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-black px-3 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                    >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden md:inline">New Transaction</span>
                        <span className="md:hidden">New Transaction</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8 overscroll-contain pb-safe">
                    <AnimatePresence mode="wait">
                        {activeTab === 'queue' && (
                            <motion.div
                                key="queue"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 max-w-3xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Transaction Queue</h3>
                                    <span className="text-xs font-mono px-2 py-1 bg-zinc-900 rounded text-zinc-500">Threshold: {safe.threshold} / {safe.owners.length}</span>
                                </div>

                                {transactions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                                        <CheckCircle2 className="w-12 h-12 text-zinc-800 mb-4" />
                                        <p className="text-zinc-500 font-medium">All caught up</p>
                                        <p className="text-zinc-600 text-sm">No pending transactions</p>
                                    </div>
                                ) : (
                                    transactions.map(tx => {
                                        const userAddress = account?.address?.toString()?.toLowerCase();
                                        const hasSigned = tx.signatures?.some((s: any) => s.signer_address.toLowerCase() === userAddress);

                                        // Derive addresses from owner public keys for comparison
                                        const isOwner = safe.owners.some(ownerPubKey => {
                                            try {
                                                const cleanPubKey = ownerPubKey.startsWith('0x') ? ownerPubKey.slice(2) : ownerPubKey;
                                                const pubKey = new Ed25519PublicKey(cleanPubKey);
                                                const derivedAddress = pubKey.authKey().derivedAddress().toString().toLowerCase();
                                                return derivedAddress === userAddress;
                                            } catch {
                                                return false;
                                            }
                                        });

                                        return (
                                            <TransactionQueueItem
                                                key={tx.id}
                                                transaction={tx}
                                                signatures={tx.signatures || []}
                                                threshold={safe.threshold}
                                                canSign={isOwner && !hasSigned}
                                                canExecute={isOwner}
                                                onSign={() => handleSign(tx)}
                                                onExecute={() => handleExecute(tx)}
                                                onDiscard={() => handleDiscard(tx)}
                                                signingTxId={signingTxId}
                                                executingTxId={executingTxId}
                                            />
                                        );
                                    })
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 max-w-3xl"
                            >
                                <h3 className="text-lg font-semibold mb-4">Transaction History</h3>

                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                                        <CheckCircle2 className="w-12 h-12 text-zinc-700 mb-3" />
                                        <p className="text-zinc-600 text-sm">No executed transactions yet</p>
                                    </div>
                                ) : (
                                    history.map(tx => {
                                        const getTransferDetails = () => {
                                            const args = tx.payload.functionArguments;
                                            if (args && args.length >= 2) {
                                                return {
                                                    recipient: String(args[0]),
                                                    amount: String(args[1])
                                                };
                                            }
                                            return { recipient: 'Unknown', amount: '0' };
                                        };
                                        const { recipient, amount } = getTransferDetails();
                                        const formatAmount = (octas: string) => {
                                            const num = parseFloat(octas) / 100000000;
                                            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
                                        };

                                        return (
                                            <div key={tx.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white">
                                                        Sent {formatAmount(amount)} MOVE
                                                        {movePrice && (
                                                            <span className="ml-2 text-xs font-normal text-zinc-500">
                                                                (≈ ${(parseFloat(amount) / 100000000 * movePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                                                        To: <code className="font-mono bg-zinc-800 px-1 py-0.5 rounded">{recipient.slice(0, 8)}...{recipient.slice(-6)}</code>
                                                    </div>
                                                    {tx.memo && (
                                                        <div className="text-xs text-zinc-400 mt-1 italic">"{tx.memo}"</div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-zinc-500">
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
                        )}

                        {activeTab === 'assets' && (
                            <motion.div
                                key="assets"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Coins className="w-24 h-24 text-white" />
                                    </div>
                                    <h4 className="text-zinc-500 font-medium text-sm mb-2">MOVE Token</h4>
                                    <div className="text-3xl font-bold mb-1">{balance.toFixed(4)} <span className="text-lg text-zinc-500">MOVE</span></div>
                                    {movePrice && (
                                        <div className="text-sm text-zinc-500">≈ ${(balance * movePrice).toFixed(2)} USD</div>
                                    )}
                                    <div className="text-sm text-zinc-600">Movement Network</div>
                                </div>
                                {/* Placeholder for other tokens */}
                                <div className="p-6 border border-dashed border-zinc-800 rounded-3xl flex items-center justify-center text-zinc-600 text-sm h-full min-h-[160px]">
                                    More assets coming soon...
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'signers' && (
                            <motion.div
                                key="signers"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <h3 className="text-lg font-semibold mb-4">Safe Owners</h3>
                                <div className="grid gap-3">
                                    {safe.owners.map((ownerPubKey, i) => {
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
                                                    <div className="text-xs text-zinc-600 mt-0.5">Owner</div>
                                                </div>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(displayAddress); toast.success("Copied"); }}
                                                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <NewTransactionModal
                    isOpen={isTxModalOpen}
                    onClose={() => setIsTxModalOpen(false)}
                    safeAddress={safeAddress}
                    safeThreshold={safe.threshold}
                    safeOwners={safe.owners}
                    onTransactionCreated={() => {
                        setIsTxModalOpen(false);
                        loadData();
                    }}
                />
            </div>

            {/* Mobile Navigation Drawer */}
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
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                                <NavItem id="queue" label="Queue" icon={History} onSelect={() => setIsMobileMenuOpen(false)} />
                                <NavItem id="history" label="History" icon={CheckCircle2} onSelect={() => setIsMobileMenuOpen(false)} />
                                <NavItem id="assets" label="Assets" icon={Coins} onSelect={() => setIsMobileMenuOpen(false)} />
                                <NavItem id="signers" label="Signers" icon={Users} onSelect={() => setIsMobileMenuOpen(false)} />
                            </div>
                            <div className="p-6 border-t border-zinc-800">
                                <button onClick={onBack} className="flex items-center gap-3 text-red-400 font-medium">
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
