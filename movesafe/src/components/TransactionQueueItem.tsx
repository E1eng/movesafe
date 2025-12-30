'use client';

import { Clock, Check, Send, Copy, ChevronDown, ChevronUp, Signature as SignatureIcon, Zap } from 'lucide-react';
import { Transaction, Signature } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

  // Helper to extract details from payload
  const getTransferDetails = () => {
    const args = transaction.payload.functionArguments;
    // Assuming 0x1::aptos_account::transfer or 0x1::coin::transfer
    // args: [recipient, amount]
    if (args && args.length >= 2) {
      return {
        recipient: String(args[0]),
        amount: String(args[1])
      };
    }
    return { recipient: 'Unknown', amount: '0' };
  };

  const { recipient, amount } = getTransferDetails();

  // Format amount from octas to MOVE
  const formatAmount = (octas: string) => {
    const num = parseFloat(octas) / 100000000;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  return (
    <Card className="overflow-hidden">
      {/* Main Content */}
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isReady
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
          {isReady ? (
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Transaction Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 dark:text-white truncate">
              Send {formatAmount(amount)} MOVE
            </h4>
            {isReady ? (
              <Badge variant="success" size="sm">Ready</Badge>
            ) : (
              <Badge variant="primary" size="sm">Pending</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>To:</span>
            <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {recipient.slice(0, 10)}...{recipient.slice(-6)}
            </code>
            <button
              onClick={() => copyToClipboard(recipient)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Signature Progress */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white">
              <SignatureIcon className="w-4 h-4" />
              {signatureCount}/{threshold}
            </div>
            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${isReady ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canSign && !isReady && (
              <Button
                size="sm"
                onClick={onSign}
                loading={isSigning}
                icon={<SignatureIcon className="w-4 h-4" />}
              >
                Sign
              </Button>
            )}
            {isReady && canExecute && (
              <Button
                size="sm"
                variant="success"
                onClick={onExecute}
                loading={isExecuting}
                icon={<Zap className="w-4 h-4" />}
              >
                Execute
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Discard
            </Button>
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Transaction ID */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
            <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {transaction.id.slice(0, 16)}...
            </code>
          </div>

          {/* Created At */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Created</span>
            <span className="text-slate-900 dark:text-white">
              {new Date(transaction.created_at).toLocaleString()}
            </span>
          </div>

          {/* Signatures */}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Signatures</p>
            <div className="space-y-1">
              {signatures.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No signatures yet</p>
              ) : (
                signatures.map((sig, i) => (
                  <div
                    key={sig.id}
                    className="flex items-center gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <Check className="w-3 h-3 text-green-500" />
                    <code className="font-mono flex-1 truncate">
                      {sig.signer_address.slice(0, 16)}...{sig.signer_address.slice(-8)}
                    </code>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
