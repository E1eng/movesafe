'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Copy, Shield, Users } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { generateSafeAddress } from '@/lib/multisig';
import { aptos, MOVEMENT_CONFIG } from '@/lib/movement';

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
  const [activateOnFinalize, setActivateOnFinalize] = useState(true);

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

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
      } catch (e: any) {
        setError(e?.message || 'Failed to load draft');
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
    } catch {
      // ignore
    }
  }, [adminTokenFromQuery, draftId]);

  const canFinalize = !!draft && !!adminToken && draft.status === 'DRAFT';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      // ignore
    }
  };

  const handleFinalize = async () => {
    if (!draft) return;
    if (!adminToken) {
      setError('Invalid draft link (missing admin token).');
      return;
    }

    if (!connected || !account) {
      setError('Connect the admin wallet to finalize and activate this safe on-chain.');
      return;
    }

    const owners = (draft.owners || []).map((o) => String(o).toLowerCase());
    if (owners.length < draft.threshold) {
      setError(`Not enough owners yet. Need at least ${draft.threshold}.`);
      return;
    }

    setFinalizing(true);
    setError(null);

    try {
      const safeAddress = generateSafeAddress(owners, draft.threshold);

      // Ensure the Safe account exists on-chain before creating proposals.
      // If it doesn't exist yet, the admin funds it once (wallet confirmation).
      if (activateOnFinalize) {
        let exists: boolean | null = null;
        let checkDetails = '';
        try {
          await aptos.getAccountInfo({ accountAddress: safeAddress });
          exists = true;
        } catch (e: any) {
          const status = e?.status ?? e?.response?.status;
          const errorCode = e?.errorCode ?? e?.data?.error_code ?? e?.response?.data?.error_code;
          const msg = e?.message || e?.response?.data?.message || 'Unknown error';

          let rpcChainId: number | null = null;
          try {
            rpcChainId = await aptos.getChainId();
          } catch {
            rpcChainId = null;
          }

          checkDetails = `RPC=${MOVEMENT_CONFIG.fullnode} expectedChainId=${MOVEMENT_CONFIG.chainId} rpcChainId=${rpcChainId ?? 'unknown'} status=${status ?? 'unknown'} errorCode=${errorCode ?? 'unknown'} message=${msg}`;

          if (status === 404 || errorCode === 'account_not_found' || errorCode === 'resource_not_found') {
            exists = false;
          } else {
            // Unknown failure (RPC/network/CORS). Don't block finalize; attempt activation transfer anyway.
            exists = null;
          }
        }

        if (exists !== true) {
          const amountOctas = '1000000'; // 0.01 MOVE

          if (!signTransaction) {
            throw new Error('Connected wallet does not support signing transactions.');
          }

          const rawTxn = await aptos.transaction.build.simple({
            sender: account.address.toString(),
            data: {
              function: '0x1::aptos_account::transfer',
              typeArguments: [],
              functionArguments: [safeAddress, amountOctas],
            },
          });

          const signed = await signTransaction({ transactionOrPayload: rawTxn });

          try {
            const committed = await aptos.transaction.submit.simple({
              transaction: rawTxn,
              senderAuthenticator: signed.authenticator,
            });

            await aptos.waitForTransaction({ transactionHash: committed.hash });
          } catch (submitErr: any) {
            const submitMsg = submitErr?.message || submitErr?.response?.data?.message || 'Unknown submit error';
            throw new Error(
              checkDetails
                ? `Failed to activate safe on-chain. Submit error: ${submitMsg}. Check: ${checkDetails}`
                : `Failed to activate safe on-chain. Submit error: ${submitMsg}.`
            );
          }
        }
      }

      const { data: finalizedAddress, error: finalizeError } = await supabase.rpc('finalize_safe_draft', {
        draft_id: draft.id,
        admin_token: adminToken,
        safe_address: safeAddress,
      });

      if (finalizeError) {
        throw finalizeError;
      }

      // Reload draft to reflect FINALIZED state
      const { data: updated, error: reloadError } = await supabase
        .from('safe_drafts')
        .select('*')
        .eq('id', draft.id)
        .single();

      if (reloadError) throw reloadError;
      setDraft(updated as SafeDraft);

      // Cache to localStorage for quick access
      try {
        const existing = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
        const newSafe = {
          address: safeAddress,
          name: draft.name,
          threshold: draft.threshold,
          owners,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('movesafe_safes', JSON.stringify([newSafe, ...existing]));
      } catch {
        // ignore
      }

      router.push(`/safes/${String(finalizedAddress || safeAddress)}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to finalize draft');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/safes"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Safes
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Draft Safe</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Share the join link. Each owner connects their wallet and we store their <span className="font-mono">publicKey</span>.
          </p>

          {loading ? (
            <div className="text-slate-600 dark:text-slate-400">Loading...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
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
                  Owners joined: {draft.owners?.length ?? 0}/{draft.owner_limit}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Status: <span className="font-semibold">{draft.status}</span>
                </div>
                {draft.finalized_safe_address && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Finalized safe: <span className="font-mono">{draft.finalized_safe_address}</span>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">Join link</div>
                <div className="flex items-center gap-2">
                  <input
                    value={joinUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                    aria-label="Copy join link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Anyone with this link can add their wallet public key as an owner while the draft is in DRAFT state.
                </div>
              </div>

              {!connected && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg mb-6">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Connect your wallet to see whether you’re already an owner and (if creator) finalize.
                  </div>
                </div>
              )}

              {connectedPubKey && draft.owners?.map((o) => o.toLowerCase()).includes(connectedPubKey) && (
                <div className="text-sm text-green-700 dark:text-green-400 mb-6">
                  Your connected wallet is included as an owner.
                </div>
              )}

              {draft.status === 'DRAFT' && (
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/join/${draft.id}?t=${draft.join_token}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Join this draft
                  </Link>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={activateOnFinalize}
                      onChange={(e) => setActivateOnFinalize(e.target.checked)}
                    />
                    Activate on-chain on finalize (admin wallet confirmation)
                  </label>

                  <button
                    onClick={handleFinalize}
                    disabled={!canFinalize || finalizing}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    {finalizing ? 'Finalizing...' : canFinalize ? 'Finalize & Create Safe' : 'Missing admin token'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
