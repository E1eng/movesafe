'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Copy, Shield, Users, Link as LinkIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { generateSafeAddress } from '@/lib/multisig';
import { aptos, MOVEMENT_CONFIG } from '@/lib/movement';
import { toast } from 'sonner';

export default function DraftSafePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const draftId = String(params?.id || '');
  const adminTokenFromQuery = searchParams.get('admin') || '';

  const { connected, account, signTransaction } = useWallet();

  const [draft, setDraft] = useState<SafeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState('');

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

  const isOwner = useMemo(() => {
    if (!connectedPubKey || !draft?.owners) return false;
    return draft.owners.map((o) => String(o).toLowerCase()).includes(connectedPubKey);
  }, [connectedPubKey, draft?.owners]);

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (!draft?.join_token) return `${window.location.origin}/join/${draftId}`;
    return `${window.location.origin}/join/${draftId}?t=${draft.join_token}`;
  }, [draftId, draft?.join_token]);

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
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load draft');
        setDraft(null);
      } finally {
        setLoading(false);
      }
    };

    if (draftId) void load();
  }, [draftId]);

  useEffect(() => {
    if (adminTokenFromQuery) {
      setAdminToken(adminTokenFromQuery);
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem('movesafe_draft_admin_tokens') || '{}');
      const token = existing?.[draftId];
      if (typeof token === 'string') {
        setAdminToken(token);
      }
    } catch { }
  }, [adminTokenFromQuery, draftId]);

  const canFinalize = !!draft && !!adminToken && draft.status === 'DRAFT';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success('Invite link copied!');
    } catch { }
  };

  const handleFinalize = async () => {
    if (!draft || !adminToken || !connected || !account) return;

    const owners = (draft.owners || []).map((o) => String(o).toLowerCase());
    if (owners.length < draft.threshold) {
      setError(`Not enough owners yet. Need at least ${draft.threshold}.`);
      return;
    }

    setFinalizing(true);
    setError(null);

    try {
      const safeAddress = generateSafeAddress(owners, draft.threshold);

      // Activate on-chain
      try {
        await aptos.getAccountInfo({ accountAddress: safeAddress });
      } catch {
        if (!signTransaction) throw new Error('Wallet does not support signing');

        const rawTxn = await aptos.transaction.build.simple({
          sender: account.address.toString(),
          data: {
            function: '0x1::aptos_account::transfer',
            typeArguments: [],
            functionArguments: [safeAddress, '1000000'], // 0.01 MOVE
          },
        });

        const signed = await signTransaction({ transactionOrPayload: rawTxn });
        const committed = await aptos.transaction.submit.simple({
          transaction: rawTxn,
          senderAuthenticator: signed.authenticator,
        });
        await aptos.waitForTransaction({ transactionHash: committed.hash });
      }

      const { error: finalizeError } = await supabase.rpc('finalize_safe_draft', {
        draft_id: draft.id,
        admin_token: adminToken,
        safe_address: safeAddress,
      });

      if (finalizeError) throw finalizeError;

      // Cache locally
      try {
        const existing = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
        existing.unshift({
          address: safeAddress,
          name: draft.name,
          threshold: draft.threshold,
          owners,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('movesafe_safes', JSON.stringify(existing));
      } catch { }

      toast.success('Safe finalized!');
      router.push(`/dashboard?safe=${safeAddress}`);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Failed to finalize draft');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white p-8">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Draft Not Found</h3>
        <p className="text-zinc-500 mb-6">{error || 'This draft may have been deleted.'}</p>
        <button
          onClick={() => router.push('/select')}
          className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Back to Safes
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 bg-black text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <button
          onClick={() => router.push('/drafts')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Drafts</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{draft.name}</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {draft.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1">Signatures Required</div>
          <div className="text-xl font-bold">{draft.threshold}</div>
        </div>
        <div className="flex-1 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="text-xs text-zinc-500 mb-1">Owners Joined</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {draft.owners?.length || 0}/{draft.owner_limit}
            {(draft.owners?.length || 0) >= draft.owner_limit && (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            )}
          </div>
        </div>
      </div>

      {/* Invite Link */}
      <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
          <LinkIcon className="w-4 h-4" />
          Invite Link
        </div>
        <div className="flex gap-2">
          <input
            value={joinUrl}
            readOnly
            className="flex-1 bg-black border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Share this link with co-signers. They connect their wallet to join.
        </p>
      </div>

      {/* Status Message */}
      {isOwner && (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            You are already an owner of this draft.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      {draft.status === 'DRAFT' && (
        <div className="mt-auto space-y-3">
          {!isOwner && (
            <button
              onClick={() => router.push(`/join/${draft.id}?t=${draft.join_token}`)}
              className="w-full py-4 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-2xl font-bold transition-colors"
            >
              Join This Draft
            </button>
          )}

          <button
            onClick={handleFinalize}
            disabled={!canFinalize || finalizing}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {finalizing && <Loader2 className="w-4 h-4 animate-spin" />}
            <Shield className="w-5 h-5" />
            {finalizing ? 'Finalizing...' : canFinalize ? 'Finalize & Create Safe' : 'Missing Admin Token'}
          </button>
        </div>
      )}

      {draft.status === 'FINALIZED' && draft.finalized_safe_address && (
        <div className="mt-auto">
          <button
            onClick={() => router.push(`/dashboard?safe=${draft.finalized_safe_address}`)}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
          >
            Open Safe Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
