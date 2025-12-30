'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateSafeAddress } from '@/lib/multisig';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function CreateSafePage() {
  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  const router = useRouter();
  const { account } = useWallet();

  const [safeName, setSafeName] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [ownerLimit, setOwnerLimit] = useState(2);
  const [mode, setMode] = useState<'invite' | 'manual'>('invite');
  const [owners, setOwners] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOwner = () => {
    setOwners([...owners, '']);
  };

  const removeOwner = (index: number) => {
    if (owners.length > 1) {
      setOwners(owners.filter((_, i) => i !== index));
      if (threshold > owners.length - 1) {
        setThreshold(owners.length - 1);
      }
    }
  };

  const updateOwner = (index: number, value: string) => {
    const newOwners = [...owners];
    newOwners[index] = value;
    setOwners(newOwners);
  };

  const handleCreateSafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!account?.publicKey) {
        throw new Error('Connect your wallet first. Safe creation requires an owner wallet.');
      }

      if (!safeName.trim()) {
        throw new Error('Safe name is required');
      }

      const normalizeHex = (v: string) => {
        const t = v.trim();
        if (!t) return '';
        const withPrefix = t.startsWith('0x') ? t : `0x${t}`;
        return withPrefix.toLowerCase();
      };

      const connectedPubKey = account.publicKey.toString().toLowerCase();

      if (mode === 'invite') {
        const limit = Math.max(1, Number(ownerLimit) || 1);
        if (threshold < 1) {
          throw new Error('Threshold must be at least 1');
        }
        if (threshold > limit) {
          throw new Error(`Threshold (${threshold}) cannot exceed owner limit (${limit})`);
        }

        const draftId = crypto.randomUUID();
        const joinToken = crypto.randomUUID();
        const adminToken = crypto.randomUUID();
        const { error: dbError } = await supabase
          .from('safe_drafts')
          .insert({
            id: draftId,
            name: safeName.trim(),
            threshold,
            owner_limit: limit,
            owners: [connectedPubKey],
            created_by_pubkey: connectedPubKey,
            join_token: joinToken,
            admin_token: adminToken,
          });

        if (dbError) {
          throw new Error(`Failed to create draft safe: ${dbError.message}`);
        }

        try {
          const existing = JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}');
          localStorage.setItem(
            'movesafe_draft_admin_tokens',
            JSON.stringify({
              ...existing,
              [draftId]: adminToken,
            })
          );
        } catch {
          // ignore
        }

        router.push(`/draft/${draftId}?admin=${adminToken}`);
        return;
      }

      const validOwners = owners.filter(o => o.trim() !== '');
      const normalizedOwners = validOwners.map(normalizeHex).filter(Boolean);

      if (validOwners.length < threshold) {
        throw new Error(`Threshold (${threshold}) cannot exceed number of owners (${validOwners.length})`);
      }

      if (validOwners.length < 1) {
        throw new Error('At least one owner is required');
      }

      if (!normalizedOwners.includes(connectedPubKey)) {
        throw new Error('Your connected wallet must be included as an owner public key.');
      }

      const safeAddress = generateSafeAddress(normalizedOwners, threshold);

      if (DEBUG) console.log('📝 Generating safe with address:', safeAddress);

      // Check if safe already exists
      const { data: existingSafe } = await supabase
        .from('safes')
        .select('*')
        .eq('address', safeAddress)
        .single();

      if (existingSafe) {
        if (DEBUG) console.log('⚠️ Safe already exists, redirecting to it');
        alert(`ℹ️ Safe Already Exists\n\nA safe with these owners and threshold already exists.\n\nRedirecting you to the existing safe: "${existingSafe.name}"`);

        // Save to localStorage
        const storedSafes = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
        const alreadyStored = storedSafes.find((s: any) => s.address === safeAddress);
        if (!alreadyStored) {
          localStorage.setItem('movesafe_safes', JSON.stringify([existingSafe, ...storedSafes]));
        }
        router.push(`/safes/${safeAddress}`);
        return;
      }

      if (DEBUG) console.log('📝 Creating new safe with address:', safeAddress);

      const { error: dbError } = await supabase
        .from('safes')
        .insert({
          address: safeAddress,
          name: safeName.trim(),
          threshold,
          owners: normalizedOwners,
        });

      if (dbError) {
        console.error('❌ Supabase insert error:', dbError);
        console.error('Error details:', JSON.stringify(dbError, null, 2));
        throw new Error(`Failed to create safe: ${dbError.message || dbError.hint || 'Unknown database error'}`);
      }

      if (DEBUG) console.log('✅ Safe created in Supabase');

      // Save to localStorage for quick access
      const existingSafes = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
      const newSafe = {
        address: safeAddress,
        name: safeName.trim(),
        threshold,
        owners: normalizedOwners,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('movesafe_safes', JSON.stringify([newSafe, ...existingSafes]));

      // Wait a moment for Supabase to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push(`/safes/${safeAddress}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create safe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/safes"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Safes
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-50">
            Create New Safe
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Set up a multisig wallet with K-of-N signature requirements
          </p>

          <form onSubmit={handleCreateSafe} className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('invite')}
                className={`px-4 py-2 rounded-lg font-medium border ${mode === 'invite'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600'
                  }`}
              >
                Connect to Join
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-lg font-medium border ${mode === 'manual'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600'
                  }`}
              >
                Manual Owners
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Safe Name
              </label>
              <input
                type="text"
                value={safeName}
                onChange={(e) => setSafeName(e.target.value)}
                placeholder="e.g., Team Treasury"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Threshold (Required Signatures)
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={mode === 'invite' ? Math.max(1, Number(ownerLimit) || 1) : owners.filter(o => o.trim()).length}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Number of signatures required to execute transactions
              </p>
            </div>

            {mode === 'invite' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Owner Limit (N)
                </label>
                <input
                  type="number"
                  value={ownerLimit}
                  onChange={(e) => setOwnerLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  How many wallets can join this safe via the invite link
                </p>
              </div>
            )}

            {mode === 'manual' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Owner Public Keys
                  </label>
                  <button
                    type="button"
                    onClick={addOwner}
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Owner
                  </button>
                </div>

                <div className="space-y-3">
                  {owners.map((owner, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={owner}
                        onChange={(e) => updateOwner(index, e.target.value)}
                        placeholder="0x... (Public Key)"
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {owners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOwner(index)}
                          className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Add the public keys (hex format) of all owners who can sign transactions
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Creating Safe...' : 'Create Safe'}
              </button>
              <Link
                href="/safes"
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
