'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArrowLeft, Plus, Trash2, Users, Shield, Link as LinkIcon, Check } from 'lucide-react';
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
        // Manual mode
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
    <div className="max-w-xl mx-auto py-12 px-4">
      <Link
        href="/safes"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Safes
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Create New Safe
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Configure security settings and owners.
        </p>
      </div>

      <Card>
        <form onSubmit={handleCreateSafe} className="p-6 space-y-8">

          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('invite')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-left
                ${mode === 'invite'
                  ? 'border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white bg-slate-50 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${mode === 'invite' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-slate-900 dark:text-white">Invite Owners</span>
                <span className="text-xs text-slate-500">Send a link to join</span>
              </div>
              {mode === 'invite' && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-slate-900 dark:text-white" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`
                relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-left
                ${mode === 'manual'
                  ? 'border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white bg-slate-50 dark:bg-slate-800'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${mode === 'manual' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-slate-900 dark:text-white">Manual Setup</span>
                <span className="text-xs text-slate-500">Enter public keys</span>
              </div>
              {mode === 'manual' && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-slate-900 dark:text-white" />
                </div>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <Input
              label="Safe Name"
              value={safeName}
              onChange={(e) => setSafeName(e.target.value)}
              placeholder="e.g. Treasury v1"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value)))}
                min={1}
                hint="Required signatures"
              />

              {mode === 'invite' ? (
                <Input
                  label="Total Owners"
                  type="number"
                  value={ownerLimit}
                  onChange={(e) => setOwnerLimit(Math.max(1, parseInt(e.target.value)))}
                  min={1}
                  hint="Owners to invite"
                />
              ) : (
                <div className="opacity-75">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Owners
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    {owners.length}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500">Based on list below</p>
                </div>
              )}
            </div>
          </div>

          {mode === 'manual' && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900 dark:text-white">Owner Keys</label>
                <Button type="button" variant="ghost" size="sm" onClick={addOwner}>
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {owners.map((owner, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={owner}
                      onChange={(e) => updateOwner(idx, e.target.value)}
                      placeholder="Ed25519 Public Key..."
                      className="font-mono text-xs"
                    />
                    {owners.length > 1 && (
                      <button type="button" onClick={() => removeOwner(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full justify-center">
            {mode === 'invite' ? 'Create & Get Invite Link' : 'Create Safe'}
          </Button>

        </form>
      </Card>
    </div>
  );
}
