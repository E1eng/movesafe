'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArrowLeft, Plus, Trash2, Users, Shield, Link as LinkIcon } from 'lucide-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function CreateSafePage() {
  const router = useRouter();
  const { connected, account } = useWallet();

  const [mode, setMode] = useState<'invite' | 'manual'>('invite');
  const [safeName, setSafeName] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [ownerLimit, setOwnerLimit] = useState(3);
  const [owners, setOwners] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const connectedPubKey = account?.publicKey?.toString().toLowerCase() || '';

  const addOwner = () => setOwners([...owners, '']);
  const removeOwner = (index: number) => setOwners(owners.filter((_, i) => i !== index));
  const updateOwner = (index: number, value: string) => {
    const updated = [...owners];
    updated[index] = value;
    setOwners(updated);
  };

  const handleCreateSafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!connected || !connectedPubKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!safeName.trim()) {
      setError('Please enter a safe name');
      return;
    }

    if (mode === 'manual') {
      const validOwners = owners.filter((o) => o.trim());
      if (validOwners.length < 2) {
        setError('At least 2 owners are required');
        return;
      }
      if (threshold > validOwners.length) {
        setError('Threshold cannot exceed number of owners');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'invite') {
        // Create draft with join link
        const adminToken = crypto.randomUUID();
        const joinToken = crypto.randomUUID();

        const draft: Partial<SafeDraft> = {
          name: safeName.trim(),
          threshold,
          owner_limit: ownerLimit,
          owners: [connectedPubKey],
          status: 'DRAFT',
          admin_token: adminToken,
          join_token: joinToken,
        };

        const { data, error: insertError } = await supabase
          .from('safe_drafts')
          .insert([draft])
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Store admin token locally
        try {
          const existing = JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}');
          existing[data.id] = adminToken;
          localStorage.setItem('movesafe_draft_admin_tokens', JSON.stringify(existing));
        } catch { }

        router.push(`/draft/${data.id}?admin=${adminToken}`);
      } else {
        // Manual mode - create safe directly
        const validOwners = owners.filter((o) => o.trim()).map((o) => o.toLowerCase());

        // Generate safe address (simplified)
        const safeAddress = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`;

        const safe = {
          address: safeAddress,
          name: safeName.trim(),
          threshold,
          owners: validOwners,
        };

        const { error: insertError } = await supabase
          .from('safes')
          .insert([safe]);

        if (insertError) throw insertError;

        // Also save to localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
          existing.unshift({ ...safe, createdAt: new Date().toISOString() });
          localStorage.setItem('movesafe_safes', JSON.stringify(existing));
        } catch { }

        router.push(`/safes/${safeAddress}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create safe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back Button */}
      <Link
        href="/safes"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Safes
      </Link>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Create New Safe</CardTitle>
            <CardDescription className="mt-1">
              Set up a multisig wallet with K-of-N signature requirements
            </CardDescription>
          </div>
        </CardHeader>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          <button
            type="button"
            onClick={() => setMode('invite')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border-2 transition-all ${mode === 'invite'
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
          >
            <LinkIcon className="w-4 h-4" />
            Invite to Join
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border-2 transition-all ${mode === 'manual'
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
          >
            <Users className="w-4 h-4" />
            Manual Owners
          </button>
        </div>

        <form onSubmit={handleCreateSafe} className="space-y-6">
          {/* Safe Name */}
          <Input
            label="Safe Name"
            value={safeName}
            onChange={(e) => setSafeName(e.target.value)}
            placeholder="e.g., Team Treasury"
            required
          />

          {/* Threshold */}
          <Input
            label="Threshold (Required Signatures)"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={mode === 'invite' ? ownerLimit : owners.filter((o) => o.trim()).length || 10}
            hint="Number of signatures required to execute transactions"
          />

          {/* Invite Mode - Owner Limit */}
          {mode === 'invite' && (
            <Input
              label="Owner Limit (N)"
              type="number"
              value={ownerLimit}
              onChange={(e) => setOwnerLimit(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              hint="How many wallets can join this safe via the invite link"
            />
          )}

          {/* Manual Mode - Owner List */}
          {mode === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Owner Public Keys
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={addOwner}>
                  <Plus className="w-4 h-4" />
                  Add Owner
                </Button>
              </div>
              <div className="space-y-3">
                {owners.map((owner, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={owner}
                      onChange={(e) => updateOwner(index, e.target.value)}
                      placeholder="0x... (Public Key)"
                      className="flex-1"
                    />
                    {owners.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeOwner(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Add the public keys (hex format) of all owners
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
              icon={<Shield className="w-5 h-5" />}
            >
              {loading ? 'Creating...' : mode === 'invite' ? 'Create & Get Link' : 'Create Safe'}
            </Button>
            <Link href="/safes">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
