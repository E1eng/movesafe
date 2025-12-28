'use client';

import { useState } from 'react';
import { Send, CheckCircle, FileSignature } from 'lucide-react';
import { Transaction, Signature } from '@/lib/supabase';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface TransactionQueueItemProps {
  transaction: Transaction;
  threshold: number;
  signatureCount: number;
  signatures: Signature[];
  ownerPublicKeys: string[];
  onSign: (txId: string) => Promise<void>;
  onExecute: (txId: string) => Promise<void>;
}

export function TransactionQueueItem({
  transaction,
  threshold,
  signatureCount,
  signatures,
  ownerPublicKeys,
  onSign,
  onExecute,
}: TransactionQueueItemProps) {
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);

  const isExecutable = signatureCount >= threshold;
  const hasSigned = account?.address 
    ? signatures.some(
        (sig) => sig.signer_address.toLowerCase() === account.address.toString().toLowerCase()
      )
    : false;

  const handleSign = async () => {
    setLoading(true);
    try {
      await onSign(transaction.id);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      await onExecute(transaction.id);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionDescription = () => {
    const { payload } = transaction;
    if (payload.function === '0x1::coin::transfer' || payload.function === '0x1::aptos_account::transfer') {
      const recipient = payload.functionArguments[0];
      const amount = payload.functionArguments[1];
      const moveAmount = (Number(amount) / 100000000).toFixed(8);
      return (
        <div>
          <span className="font-medium">Transfer </span>
          <span className="font-mono text-blue-600 dark:text-blue-400">
            {moveAmount} MOVE
          </span>
          <span> to </span>
          <span className="font-mono text-slate-600 dark:text-slate-400">
            {formatAddress(recipient)}
          </span>
        </div>
      );
    }
    return <span className="font-mono text-sm">{payload.function}</span>;
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-slate-900 dark:text-slate-100 mb-1">
            {getTransactionDescription()}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>Sequence: #{transaction.sequence_number}</span>
            <span>
              Created by: {formatAddress(transaction.created_by)}
            </span>
          </div>
        </div>

        <div className="ml-4">
          <div
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              isExecutable
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            {signatureCount}/{threshold}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {account && !hasSigned && (
          <button
            onClick={handleSign}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileSignature className="w-4 h-4" />
            {loading ? 'Signing...' : 'Sign Transaction'}
          </button>
        )}

        {hasSigned && !isExecutable && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            You've signed
          </div>
        )}

        {isExecutable && (
          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Executing...' : 'Execute Transaction'}
          </button>
        )}
      </div>

      {signatures.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Signatures ({signatures.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono text-slate-700 dark:text-slate-300"
              >
                {formatAddress(sig.signer_address)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
