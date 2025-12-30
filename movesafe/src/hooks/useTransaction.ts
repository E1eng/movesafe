import { useState } from 'react';
import { aptos } from '@/lib/movement';
import { supabase } from '@/lib/supabase';
import { createTransactionPayload, TransactionPayload } from '@/lib/multisig';

interface UseTransactionProps {
  safeAddress: string;
  creatorAddress: string;
  onSuccess?: () => void;
}

interface CreateTransactionParams {
  recipient?: string;
  amount?: string; // Amount in MOVE
  customPayload?: TransactionPayload; // Optional custom payload
}

export function useTransaction({ safeAddress, creatorAddress, onSuccess }: UseTransactionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = async ({ recipient, amount, customPayload }: CreateTransactionParams) => {
    setLoading(true);
    setError(null);

    try {
      if (!creatorAddress) throw new Error('Creator address is required');

      let payload: TransactionPayload;

      // Logic: Use custom payload if provided, otherwise assume transfer
      if (customPayload) {
        payload = customPayload;
      } else {
        if (!recipient) throw new Error('Recipient address is required for transfer');
        if (!amount) throw new Error('Amount is required for transfer');

        const amountInOctas = Math.floor(parseFloat(amount) * 100_000_000);
        if (isNaN(amountInOctas) || amountInOctas <= 0) {
          throw new Error('Invalid amount');
        }

        payload = createTransactionPayload(
          '0x1::aptos_account::transfer',
          [recipient, amountInOctas.toString()],
          []
        );
      }

      // 1. Fetch On-Chain Sequence Number
      let onChainSeq = 0;
      try {
        const info = await aptos.getAccountInfo({ accountAddress: safeAddress });
        onChainSeq = Number(info.sequence_number);
      } catch (e: unknown) {
        // Safe access to error properties
        const err = e as { status?: number; errorCode?: string };
        if (err?.status === 404 || err?.errorCode === 'account_not_found') {
          throw new Error(`Safe address not activated. Please fund ${safeAddress} with MOVE first.`);
        }
        console.error('Failed to fetch account info:', e);
        throw new Error('Failed to fetch safe account info. Network might be congested.');
      }

      if (isNaN(onChainSeq)) onChainSeq = 0;

      // 2. Fetch Pending Transactions from DB
      const { data: pendingTxs, error: dbFetchError } = await supabase
        .from('transactions')
        .select('sequence_number')
        .eq('safe_address', safeAddress)
        .in('status', ['PENDING', 'EXECUTED'])
        .order('sequence_number', { ascending: false })
        .limit(1);

      if (dbFetchError) throw new Error(`Database error: ${dbFetchError.message}`);

      const maxPendingSeq = pendingTxs?.[0]?.sequence_number
        ? Number(pendingTxs[0].sequence_number)
        : -1;

      // 3. Determine Next Sequence Number
      const nextSequenceNumber = Math.max(onChainSeq, maxPendingSeq + 1);

      console.log(`[Transaction] OnChain: ${onChainSeq}, DB Max: ${maxPendingSeq} -> Next: ${nextSequenceNumber}`);

      // 4. (Payload already constructed above)

      // 5. Build Preview Transaction for Gas Estimation
      // We set a long expiration (30 days) because multisig collection takes time.
      const expireTimestamp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

      const previewTxn = await aptos.transaction.build.simple({
        sender: safeAddress,
        data: {
          function: payload.function as `${string}::${string}::${string}`,
          typeArguments: payload.typeArguments,
          functionArguments: payload.functionArguments,
        },
        options: {
          accountSequenceNumber: nextSequenceNumber,
          expireTimestamp,
        },
      });

      // 6. Estimate Gas with reasonable buffer and cap
      // Using smaller buffer (1.1x) and capping maxGas to prevent INSUFFICIENT_BALANCE errors
      const rawMaxGas = Number((previewTxn as any).rawTransaction?.max_gas_amount) || 5000;
      const rawGasPrice = Number((previewTxn as any).rawTransaction?.gas_unit_price) || 100;

      // Cap max gas at 50000 (0.005 MOVE at price 100) to keep fees reasonable
      const gasUnitPrice = Math.max(100, Math.ceil(rawGasPrice * 1.1));
      const maxGasAmount = Math.min(50000, Math.max(5000, Math.ceil(rawMaxGas * 1.1)));

      const txOptions = {
        maxGasAmount: String(maxGasAmount),
        gasUnitPrice: String(gasUnitPrice),
        expireTimestamp: String(expireTimestamp),
      };

      // 7. Store Proposal in DB
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          safe_address: safeAddress,
          payload: { ...payload, txOptions },
          created_by: creatorAddress,
          sequence_number: nextSequenceNumber,
          status: 'PENDING',
        });

      if (insertError) throw new Error(`Failed to save transaction: ${insertError.message}`);

      if (onSuccess) onSuccess();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An unexpected error occurred');
      console.error('Transaction Creation Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    createTransaction,
    loading,
    error,
    setError,
  };
}
