'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Shield, Users, ArrowLeft, Check, Wallet } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
    return (draft.owners?.length ?? 0) >= draft.owner_limit;
  }, [draft]);

  const isJoinable = useMemo(() => {
    return !!draft && draft.status === 'DRAFT' && !!joinToken && !alreadyOwner && !isFull && connected;
  }, [draft, joinToken, alreadyOwner, isFull, connected]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('safe_drafts')
          .select('*')
          .eq('id', draftId)
          .single();

        if (error) throw error;
        setDraft(data as SafeDraft);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load draft');
      } finally {
        setLoading(false);
      }
    };

    if (draftId) void load();
  }, [draftId]);

  const handleJoin = async () => {
    if (!connectedPubKey || !draft || !joinToken) return;

    setJoining(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('join_safe_draft', {
        draft_id: draft.id,
        join_token: joinToken,
        owner_pubkey: connectedPubKey,
      });

      if (error) throw error;
      router.push(`/draft/${draft.id}`);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-pulse">
          <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded mb-2" />
          <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
        </Card>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card variant="outline" className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Draft Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'This draft may have been deleted.'}</p>
          <Link href="/safes">
            <Button variant="secondary">Back to Safes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg mx-auto">
      <Link
        href="/safes"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Safes
      </Link>

      <Card>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join Safe</h1>
          <p className="text-slate-600 dark:text-slate-400">
            You&apos;ve been invited to join a multisig safe
          </p>
        </div>

        {/* Safe Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{draft.name}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary" size="sm">
              <Users className="w-3 h-3" />
              {draft.threshold} signatures required
            </Badge>
            <Badge variant="default" size="sm">
              {draft.owners?.length || 0}/{draft.owner_limit} joined
            </Badge>
            {draft.status !== 'DRAFT' && (
              <Badge variant="warning" size="sm">{draft.status}</Badge>
            )}
          </div>
        </div>

        {/* States */}
        {!connected ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Connect your wallet using the sidebar to join this safe.
            </p>
          </div>
        ) : alreadyOwner ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              You&apos;re already an owner of this safe!
            </p>
            <Link href={`/draft/${draft.id}`} className="mt-3 inline-block">
              <Button size="sm">View Draft</Button>
            </Link>
          </div>
        ) : isFull ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This safe has reached its owner limit.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleJoin}
            loading={joining}
            disabled={!isJoinable}
            className="w-full"
            icon={<Shield className="w-5 h-5" />}
          >
            {joining ? 'Joining...' : 'Join as Owner'}
          </Button>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
