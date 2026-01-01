'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Link as LinkIcon, Plus, Loader2, UserPlus, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

interface CreateSafeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Mode = 'invite' | 'manual';

export function CreateSafeModal({ isOpen, onClose }: CreateSafeModalProps) {
    const { account } = useWallet();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<Mode>('invite');

    // Shared fields
    const [name, setName] = useState('');
    const [threshold, setThreshold] = useState(2);

    // Invite mode fields
    const [ownerLimit, setOwnerLimit] = useState(3);

    // Manual mode fields
    const [owners, setOwners] = useState<string[]>(['']);

    const connectedPubKey = account?.publicKey?.toString().toLowerCase() || '';

    // INVITE MODE: Create a Draft
    const handleCreateDraft = async () => {
        if (!connectedPubKey) return;
        setLoading(true);
        try {
            const joinToken = crypto.randomUUID();
            const adminToken = crypto.randomUUID();

            const draft = {
                name,
                threshold,
                owner_limit: ownerLimit,
                owners: [connectedPubKey], // Creator joins automatically
                created_by_pubkey: connectedPubKey,
                join_token: joinToken,
                admin_token: adminToken,
                status: 'DRAFT'
            };

            const { data, error } = await supabase.from('safe_drafts').insert([draft]).select().single();
            if (error) throw error;

            // Store admin token locally for finalization later
            try {
                const existing = JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}');
                existing[data.id] = adminToken;
                localStorage.setItem('movesafe_draft_admin_tokens', JSON.stringify(existing));
            } catch { }

            onClose();
            router.push(`/draft/${data.id}?admin=${adminToken}`);
        } catch (e) {
            console.error('Failed to create draft:', e);
        } finally {
            setLoading(false);
        }
    };

    // MANUAL MODE: Create Safe directly
    const handleCreateSafe = async () => {
        setLoading(true);
        try {
            const validOwners = owners.filter(o => o.trim()).map(o => o.toLowerCase());
            const safeAddress = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0')).join('')}`;

            const safe = {
                address: safeAddress,
                name,
                threshold,
                owners: validOwners
            };

            const { error } = await supabase.from('safes').insert([safe]);
            if (error) throw error;

            // Local storage update
            const existing = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
            existing.unshift({ ...safe, createdAt: new Date().toISOString() });
            localStorage.setItem('movesafe_safes', JSON.stringify(existing));

            onClose();
        } catch (e) {
            console.error(e);
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
                            <label className="text-sm font-medium text-zinc-400">Required Signatures</label>
                            <Input
                                type="number"
                                min={1}
                                value={threshold}
                                onChange={e => setThreshold(parseInt(e.target.value) || 1)}
                                className="bg-zinc-950 border-zinc-800 text-white rounded-xl"
                            />
                        </div>

                        {mode === 'invite' ? (
                            <>
                                {/* Owner Limit (Invite mode) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Total Owners</label>
                                    <Input
                                        type="number"
                                        min={threshold}
                                        value={ownerLimit}
                                        onChange={e => setOwnerLimit(parseInt(e.target.value) || threshold)}
                                        className="bg-zinc-950 border-zinc-800 text-white rounded-xl"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        You'll share an invite link. Others join by connecting their wallet.
                                    </p>
                                </div>

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
                                    <label className="text-sm font-medium text-zinc-400">Owners</label>
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
                                    <button onClick={addOwner} className="text-blue-400 text-sm font-medium flex items-center gap-1 mt-2">
                                        <Plus className="w-4 h-4" /> Add Owner
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
