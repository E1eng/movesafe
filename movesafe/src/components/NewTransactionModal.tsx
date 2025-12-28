'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createTransactionPayload } from '@/lib/multisig';
import { aptos, MOVEMENT_CONFIG } from '@/lib/movement';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeAddress: string;
  creatorAddress: string;
  onSuccess: () => void;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  safeAddress,
  creatorAddress,
  onSuccess,
}: NewTransactionModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!creatorAddress?.trim()) {
        throw new Error('Connect an owner wallet to create a proposal.');
      }

      if (!recipient.trim()) {
        throw new Error('Recipient address is required');
      }

      const amountInOctas = Math.floor(parseFloat(amount) * 100000000);
      if (isNaN(amountInOctas) || amountInOctas <= 0) {
        throw new Error('Invalid amount');
      }

      const payload = createTransactionPayload(
        '0x1::aptos_account::transfer',
        [recipient.trim(), String(amountInOctas)],
        []
      );

      // Source of truth: on-chain account sequence number.
      // If the safe hasn't been funded/created on-chain yet, we can't produce valid transactions.
      let onChainSeq = 0;
      try {
        const info = await aptos.getAccountInfo({ accountAddress: safeAddress });
        onChainSeq = Number(info.sequence_number);
        if (Number.isNaN(onChainSeq)) onChainSeq = 0;
      } catch (e: any) {
        const status = e?.status ?? e?.response?.status;
        const errorCode = e?.errorCode ?? e?.data?.error_code ?? e?.response?.data?.error_code;

        let rpcChainId: number | null = null;
        try {
          rpcChainId = await aptos.getChainId();
        } catch {
          rpcChainId = null;
        }

        // Only show "not activated" if chain explicitly says the account doesn't exist.
        if (status === 404 || errorCode === 'account_not_found' || errorCode === 'resource_not_found') {
          throw new Error(
            `Safe is not activated on-chain yet. Fund this safe address with MOVE first: ${safeAddress}`
          );
        }

        throw new Error(
          `Failed to fetch safe account info from Movement RPC (${MOVEMENT_CONFIG.fullnode}). Expected Bardock chainId=${MOVEMENT_CONFIG.chainId}, RPC chainId=${rpcChainId ?? 'unknown'}. Safe: ${safeAddress}`
        );
      }

      // Reserve sequential sequence numbers for pending proposals in our DB.
      const { data: pendingMax } = await supabase
        .from('transactions')
        .select('sequence_number')
        .eq('safe_address', safeAddress)
        .eq('status', 'PENDING')
        .order('sequence_number', { ascending: false })
        .limit(1);

      const reservedMax = pendingMax && pendingMax.length > 0 ? Number(pendingMax[0].sequence_number) : -1;
      const nextSequenceNumber = Math.max(onChainSeq, reservedMax + 1);

      // Deterministic tx bytes across sign + execute:
      // pick an expireTimestamp far enough into the future (1 week) and store the gas params we used.
      // Keep TTL short (2 minutes) so stuck hashes expire quickly and sequences free up.
      const expireTimestamp = Math.floor(Date.now() / 1000) + 2 * 60;
      const previewTxn = await aptos.transaction.build.simple({
        sender: safeAddress,
        data: {
          function: payload.function as `${string}::${string}::${string}`,
          typeArguments: payload.typeArguments || [],
          functionArguments: payload.functionArguments || [],
        },
        options: {
          accountSequenceNumber: nextSequenceNumber,
          expireTimestamp,
        },
      });

      const rawMaxGas = Number((previewTxn as any).rawTransaction?.max_gas_amount?.toString?.() || '0');
      const rawGasPrice = Number((previewTxn as any).rawTransaction?.gas_unit_price?.toString?.() || '0');

      const boostedMaxGas = rawMaxGas > 0 ? Math.ceil(rawMaxGas * 2) : 0;
      const boostedGasPrice = rawGasPrice > 0 ? Math.ceil(rawGasPrice * 3) : 0;

      const maxGasFloor = 400_000;
      const gasPriceFloor = 250; // Movement mempool accepts txs faster with >=250 nanoApt per unit.

      const maxGasAmount = Math.max(boostedMaxGas, maxGasFloor);
      const gasUnitPrice = Math.max(boostedGasPrice, gasPriceFloor);

      const txOptions = {
        maxGasAmount: maxGasAmount.toString(),
        gasUnitPrice: gasUnitPrice.toString(),
        expireTimestamp: (previewTxn as any).rawTransaction?.expiration_timestamp_secs?.toString?.(),
      };

      const payloadWithOptions = {
        ...payload,
        txOptions,
      };

      const { error: dbError } = await supabase
        .from('transactions')
        .insert({
          safe_address: safeAddress,
          payload: payloadWithOptions,
          created_by: creatorAddress,
          sequence_number: nextSequenceNumber,
          status: 'PENDING',
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setRecipient('');
      setAmount('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            New Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Amount (MOVE)
            </label>
            <input
              type="number"
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
