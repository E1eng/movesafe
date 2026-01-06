'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Plus, Loader2, UserPlus, Edit3 } from 'lucide-react';
import { getSupabaseWithWallet } from '@/lib/supabase';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { aptos } from '@/lib/movement';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { generateSafeAddress } from '@/lib/multisig';

interface CreateSafeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Mode = 'invite' | 'manual';

export function CreateSafeModal({ isOpen, onClose }: CreateSafeModalProps) {
    const { account, signAndSubmitTransaction, signTransaction } = useWallet();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('invite');

    // Shared fields
    const [name, setName] = useState('');
    const [threshold, setThreshold] = useState(2);



    // Manual mode fields
    const [owners, setOwners] = useState<string[]>(['']);

    const connectedPubKey = account?.publicKey?.toString().toLowerCase() || '';

    // INVITE MODE: Create a Draft
    const handleCreateDraft = async () => {
        if (!account) {
            toast.error("Please connect your wallet first");
            return;
        }

        setLoading(true);
        try {
            const treasuryAddr = process.env.NEXT_PUBLIC_TREASURY_ADDRESS?.replace(/['"]/g, '').trim().toLowerCase();
            if (!treasuryAddr) throw new Error("Treasury address is not configured in environment variables.");

            // 1. Pay Platform Fee (1 MOVE)
            toast.info("Paying Platform Fee (1.0 MOVE)...");

            const response = await signAndSubmitTransaction({
                data: {
                    function: '0x1::aptos_account::transfer',
                    functionArguments: [treasuryAddr, "100000000"], // 1.0 MOVE
                }
            });

            // 2. Wait for confirmation
            await aptos.waitForTransaction({ transactionHash: response.hash });
            toast.success("Platform Fee Paid successfully!");

            // 3. Create Draft in Supabase
            const joinToken = crypto.randomUUID();
            const adminToken = crypto.randomUUID();

            const draft = {
                name: name.trim() || 'Untitled Safe',
                threshold,
                owner_limit: threshold,
                owners: [connectedPubKey],
                created_by_pubkey: connectedPubKey,
                join_token: joinToken,
                admin_token: adminToken,
                status: 'DRAFT'
            };

            const db = getSupabaseWithWallet(account.address.toString(), account.publicKey?.toString());
            const { data, error: dbError } = await db.from('safe_drafts').insert([draft]).select().single();

            if (dbError) {
                console.error("Supabase error:", dbError);
                throw new Error(`Failed to save draft: ${dbError.message}`);
            }

            // 4. Cache Admin Token
            try {
                const existing = JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}');
                existing[data.id] = adminToken;
                localStorage.setItem('movesafe_draft_admin_tokens', JSON.stringify(existing));
            } catch (e) {
                console.warn("Failed to cache admin token locally:", e);
            }

            toast.success("Safe Draft created! Redirecting...");
            onClose();
            router.push(`/draft/${data.id}?admin=${adminToken}`);
        } catch (e: any) {
            console.error('HandleCreateDraft error:', e);
            const errorMsg = e.message || 'An unexpected error occurred';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // MANUAL MODE: Create Safe directly
    const handleCreateSafe = async () => {
        if (!account) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!name.trim()) {
            toast.error("Safe name is required");
            return;
        }

        setLoading(true);
        try {
            const treasuryAddr = process.env.NEXT_PUBLIC_TREASURY_ADDRESS?.replace(/['"]/g, '').trim().toLowerCase();
            if (!treasuryAddr) throw new Error("Treasury address not configured.");

            // 1. Pay Platform Fee (1 MOVE)
            toast.info("Paying Platform Fee (1.0 MOVE)...");
            const feeResponse = await signAndSubmitTransaction({
                data: {
                    function: '0x1::aptos_account::transfer',
                    functionArguments: [treasuryAddr, "100000000"], // 1.0 MOVE
                }
            });

            await aptos.waitForTransaction({ transactionHash: feeResponse.hash });
            toast.success("Platform Fee Paid!");

            // 2. Derive Safe Address & Create in DB
            const validOwners = owners.filter(o => o.trim()).map(o => o.toLowerCase());

            // Re-validate that all owners have provided public keys (length ~64-66)
            for (const owner of validOwners) {
                const clean = owner.replace(/^0x/, '');
                if (clean.length !== 64) {
                    throw new Error(`Invalid Public Key: ${owner}. Owners must provide a 64-character public key hex.`);
                }
            }

            const safeAddress = generateSafeAddress(validOwners, threshold);

            const safe = {
                address: safeAddress.toLowerCase(),
                name: name.trim(),
                threshold,
                owners: validOwners
            };

            const dbSafe = getSupabaseWithWallet(account.address.toString(), account.publicKey?.toString());
            const { error: dbError } = await dbSafe.from('safes').insert([safe]);

            if (dbError) {
                console.error("Database error:", dbError);
                throw new Error(`Failed to save Safe to database: ${dbError.message}`);
            }

            // 3. Local storage update
            try {
                const existing = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
                existing.unshift({ ...safe, createdAt: new Date().toISOString() });
                localStorage.setItem('movesafe_safes', JSON.stringify(existing));
            } catch (e) {
                console.warn("Failed to update local storage:", e);
            }

            toast.success("Safe Created Successfully!");
            onClose();
            router.push('/dashboard');
        } catch (e: any) {
            console.error("HandleCreateSafe error:", e);
            const errorMsg = e.message || "Failed to create safe";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const addOwner = () => setOwners([...owners, '']);
    const updateOwner = (i: number, val: string) => {
        const newOwners = [...owners];
        newOwners[i] = val;
        setOwners(newOwners);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pb-0">
                        <h3 className="text-lg font-bold text-white">New Safe</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex gap-2 p-6 pb-4">
                        <button
                            onClick={() => setMode('invite')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${mode === 'invite'
                                ? 'bg-white text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Invite
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${mode === 'manual'
                                ? 'bg-white text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            <Edit3 className="w-4 h-4" />
                            Manual
                        </button>
                    </div>

                    <div className="px-6 pb-6 space-y-4">
                        {/* Safe Name (shared) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Safe Name</label>
                            <Input
                                value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g. Treasury"
                                className="bg-zinc-950 border-zinc-800 text-white rounded-xl"
                            />
                        </div>

                        {/* Threshold (shared) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Approvals Needed</label>
                            <Input
                                type="number"
                                min={1}
                                value={threshold}
                                onChange={e => setThreshold(parseInt(e.target.value) || 1)}
                                className="bg-zinc-950 border-zinc-800 text-white rounded-xl"
                            />
                            <p className="text-xs text-zinc-500">How many members must approve each transaction</p>
                        </div>

                        {mode === 'invite' ? (
                            <>
                                <button
                                    onClick={handleCreateDraft}
                                    disabled={loading || !name.trim()}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <LinkIcon className="w-4 h-4" />
                                    Create & Get Invite Link
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Owners (Manual mode) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Member Public Keys</label>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                        {owners.map((owner, i) => (
                                            <Input
                                                key={i}
                                                value={owner}
                                                onChange={e => updateOwner(i, e.target.value)}
                                                placeholder="Public Key (Hex)"
                                                className="bg-zinc-950 border-zinc-800 text-white rounded-xl font-mono text-xs"
                                            />
                                        ))}
                                    </div>
                                    <button onClick={addOwner} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2 hover:text-blue-300 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Member
                                    </button>
                                </div>

                                <button
                                    onClick={handleCreateSafe}
                                    disabled={loading || !name.trim()}
                                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Safe
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
