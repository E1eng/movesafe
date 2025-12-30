'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Shield, Users, ArrowLeft } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase, SafeDraft } from '@/lib/supabase';

export default function JoinDraftSafePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const draftId = String(params?.id || '');
  const joinToken = searchParams.get('t') || '';

  const { connected, account } = useWallet();

  const [draft, setDraft] = useState<SafeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

  const alreadyOwner = useMemo(() => {
    if (!connectedPubKey || !draft?.owners) return false;
    return draft.owners.map((o) => String(o).toLowerCase()).includes(connectedPubKey);
  }, [connectedPubKey, draft?.owners]);

  const isFull = useMemo(() => {
    if (!draft) return false;
    const count = draft.owners?.length ?? 0;
    return count >= draft.owner_limit;
  }, [draft]);

  const isJoinable = useMemo(() => {
    return !!draft && draft.status === 'DRAFT' && !!joinToken && !alreadyOwner && !isFull;
  }, [draft, joinToken, alreadyOwner, isFull]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('safe_drafts')
          .select('*')
          .eq('id', draftId)
          .single();

        if (dbError) throw dbError;
        setDraft(data as SafeDraft);
      } catch (e: any) {
        setError(e?.message || 'Failed to load draft');
        setDraft(null);
      } finally {
        setLoading(false);
      }
    };

    if (draftId) void load();
  }, [draftId]);

  const handleJoin = async () => {
    if (!connectedPubKey) {
      setError('Connect your wallet first.');
      return;
    }
    if (!draft) return;

    if (!joinToken) {
      setError('Invalid join link (missing token).');
      return;
    }

    setJoining(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('join_safe_draft', {
        draft_id: draft.id,
        join_token: joinToken,
        owner_pubkey: connectedPubKey,
      });

      if (rpcError) throw rpcError;
      setDraft(data as SafeDraft);

      // If you joined successfully, send you to the draft page.
      router.push(`/draft/${draft.id}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to join draft');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/safes"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Safes
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Join Safe</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connect your wallet to join this draft safe. We will store your wallet <span className="font-mono">publicKey</span>
            as an owner.
          </p>

          {loading ? (
            <div className="text-slate-600 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            </div>
          ) : !draft ? (
            <div className="text-slate-600 dark:text-slate-400">Draft not found.</div>
          ) : (
            <>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                <div className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{draft.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {draft.threshold}/{draft.owner_limit} signatures
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Current owners: {draft.owners?.length ?? 0}/{draft.owner_limit}
                </div>
                {draft.status !== 'DRAFT' && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Status: <span className="font-semibold">{draft.status}</span>
                  </div>
                )}
              </div>

              {!connected ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Please connect your wallet using the button in the top-right.
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || !isJoinable}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  {joining
                    ? 'Joining...'
                    : draft.status !== 'DRAFT'
                      ? 'Draft is not joinable'
                      : !joinToken
                        ? 'Invalid join link'
                        : alreadyOwner
                          ? 'Already joined'
                          : isFull
                            ? 'Draft is full'
                            : 'Join as Owner'}
                </button>
              )}

              {alreadyOwner && (
                <div className="text-sm text-green-700 dark:text-green-400 mt-4">
                  You are already an owner in this draft.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
