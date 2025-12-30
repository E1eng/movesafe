import { useState } from 'react';
import { Send, CheckCircle, FileSignature, Trash2 } from 'lucide-react';
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
  onDiscard: (txId: string) => Promise<void>;
}

export function TransactionQueueItem({
  transaction,
  threshold,
  signatureCount,
  signatures,
  ownerPublicKeys,
  onSign,
  onExecute,
  onDiscard,
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

  const handleDiscard = async () => {
    if (!confirm('Are you sure you want to discard this transaction? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await onDiscard(transaction.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Send className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-sm text-slate-900 dark:text-slate-100 mb-1">
              {getTransactionDescription()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Created {new Date(transaction.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
            #{transaction.sequence_number}
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Pending
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {account && !hasSigned && (
          <button
            onClick={handleSign}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-slate-50 dark:text-slate-900 rounded-lg text-sm font-medium transition-colors"
          >
            <FileSignature className="w-4 h-4" />
            Sign
          </button>
        )}

        {hasSigned && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Signed
          </div>
        )}

        {isExecutable && (
          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/25"
          >
            <Send className="w-4 h-4" />
            Execute
          </button>
        )}

        {transaction.status === 'PENDING' && (
          <button
            onClick={handleDiscard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 rounded-lg text-sm font-medium transition-colors ml-auto"
            title="Discard Transaction"
          >
            <Trash2 className="w-4 h-4" />
            Discard
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
