'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArrowRight, Shield, Users } from 'lucide-react';
import { supabase, SafeDraft } from '@/lib/supabase';

export default function DraftsPage() {
  const { connected, account } = useWallet();

  const [drafts, setDrafts] = useState<SafeDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!connectedPubKey) {
        setDrafts([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('safe_drafts')
          .select('*')
          .contains('owners', [connectedPubKey])
          .order('created_at', { ascending: false })
          .limit(50);

        if (dbError) throw dbError;
        setDrafts((data || []) as SafeDraft[]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load drafts');
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [connectedPubKey]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Drafts</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Draft safes are invitation-based. Finalize to create a real Safe.
            </p>
          </div>
          <Link
            href="/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Shield className="w-4 h-4" />
            New Draft
          </Link>
        </div>

        {!connected && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Connect your wallet</h2>
            <p className="text-slate-600 dark:text-slate-400">We only show drafts you joined with your connected wallet.</p>
          </div>
        )}

        {connected && loading ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading drafts...</div>
        ) : connected && error ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
            <div className="text-slate-900 dark:text-slate-50 font-semibold mb-2">Couldn’t load drafts</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{error}</div>
          </div>
        ) : connected && drafts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-10 text-center">
            <Shield className="w-14 h-14 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">No drafts</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Create a draft to invite other owners.</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Shield className="w-5 h-5" />
              Create Draft
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((d) => {
              const hasAdminToken = (() => {
                try {
                  const tokens = JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}');
                  return typeof tokens?.[d.id] === 'string' && tokens[d.id].length > 0;
                } catch {
                  return false;
                }
              })();

              const href = hasAdminToken
                ? `/draft/${d.id}?admin=${encodeURIComponent(
                    JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}')[d.id]
                  )}`
                : `/draft/${d.id}`;

              return (
                <Link
                  key={d.id}
                  href={href}
                  className="block bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">{d.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Status: {d.status}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4" />
                    {d.threshold}/{d.owner_limit} signatures
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Owners: {d.owners?.length ?? 0}/{d.owner_limit}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
