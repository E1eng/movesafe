'use client';

import { Clock, Check, Copy, ChevronDown, ChevronUp, Signature as SignatureIcon, Zap, Trash2, Loader2 } from 'lucide-react';
import { Transaction, Signature } from '@/lib/supabase';
import { useState } from 'react';

interface TransactionQueueItemProps {
  transaction: Transaction;
  signatures: Signature[];
  threshold: number;
  canSign: boolean;
  canExecute: boolean;
  onSign: () => void;
  onExecute: () => void;
  onDiscard: () => void;
  signingTxId: string | null;
  executingTxId: string | null;
}

export function TransactionQueueItem({
  transaction,
  signatures,
  threshold,
  canSign,
  canExecute,
  onSign,
  onExecute,
  onDiscard,
  signingTxId,
  executingTxId,
}: TransactionQueueItemProps) {
  const [expanded, setExpanded] = useState(false);

  const signatureCount = signatures.length;
  const progress = Math.min((signatureCount / threshold) * 100, 100);
  const isReady = signatureCount >= threshold;
  const isSigning = signingTxId === transaction.id;
  const isExecuting = executingTxId === transaction.id;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => { });
  };

  const getTransferDetails = () => {
    const args = transaction.payload.functionArguments;
    if (args && args.length >= 2) {
      return {
        recipient: String(args[0]),
        amount: String(args[1])
      };
    }
    return { recipient: 'Unknown', amount: '0' };
  };

  const { recipient, amount } = getTransferDetails();

  const formatAmount = (octas: string) => {
    const num = parseFloat(octas) / 100000000;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
      {/* Main Content */}
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isReady
          ? 'bg-green-500/10 border border-green-500/20'
          : 'bg-blue-500/10 border border-blue-500/20'
          }`}>
          {isReady ? (
            <Check className="w-6 h-6 text-green-400" />
          ) : (
            <Clock className="w-6 h-6 text-blue-400" />
          )}
        </div>

        {/* Transaction Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">
              Send {formatAmount(amount)} MOVE
            </h4>
            {isReady ? (
              <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md border border-green-500/20">Ready</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">Pending</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>To:</span>
            <code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
              {recipient.slice(0, 10)}...{recipient.slice(-6)}
            </code>
            <button
              onClick={() => copyToClipboard(recipient)}
              className="p-1 hover:bg-zinc-800 rounded transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          {transaction.memo && (
            <div className="text-sm text-zinc-400 mt-1 italic">
              "{transaction.memo}"
            </div>
          )}
        </div>

        {/* Signature Progress */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-medium text-white">
              <SignatureIcon className="w-4 h-4" />
              {signatureCount}/{threshold}
            </div>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${isReady ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canSign && !isReady && (
              <button
                onClick={onSign}
                disabled={isSigning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isSigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <SignatureIcon className="w-4 h-4" />}
                Sign
              </button>
            )}
            {isReady && canExecute && (
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Execute
              </button>
            )}
            <button
              onClick={onDiscard}
              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Transaction ID</span>
            <code className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
              {transaction.id.slice(0, 16)}...
            </code>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Created</span>
            <span className="text-white">
              {new Date(transaction.created_at).toLocaleString()}
            </span>
          </div>

          <div>
            <p className="text-sm text-zinc-500 mb-2">Signatures</p>
            <div className="space-y-1">
              {signatures.length === 0 ? (
                <p className="text-sm text-zinc-600 italic">No signatures yet</p>
              ) : (
                signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center gap-2 text-xs p-2 bg-zinc-800 rounded-lg"
                  >
                    <Check className="w-3 h-3 text-green-400" />
                    <code className="font-mono flex-1 truncate text-zinc-300">
                      {sig.signer_address.slice(0, 16)}...{sig.signer_address.slice(-8)}
                    </code>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
