'use client';

import { Clock, Check, Copy, ChevronDown, ChevronUp, Signature as SignatureIcon, Zap, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { Transaction, Signature } from '@/lib/supabase';
import { useState } from 'react';
import { useMovePrice } from '@/hooks/useMovePrice';
import { formatAmount, getTransferDetails } from '@/lib/format';

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
  const { price: movePrice } = useMovePrice();

  const signatureCount = signatures.length;
  const progress = Math.min((signatureCount / threshold) * 100, 100);
  const isReady = signatureCount >= threshold;
  const isSigning = signingTxId === transaction.id;
  const isExecuting = executingTxId === transaction.id;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => { });
  };

  const { recipient, amount } = getTransferDetails(transaction.payload);

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-all duration-300">
      {/* Header / Summary Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 md:p-5 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {/* Status Icon */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isReady
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
            {isReady ? (
              <Check className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
            ) : (
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-white truncate text-sm md:text-lg">
                Send {formatAmount(amount)} MOVE
              </h4>
              {isReady ? (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20 font-bold uppercase tracking-wider">Ready</span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold uppercase tracking-wider">Pending</span>
              )}
            </div>

            {/* Desktop-only secondary info in header */}
            <div className="hidden md:flex items-center gap-2 mt-1 text-sm text-zinc-500">
              <span className="shrink-0">To:</span>
              <code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 truncate max-w-[200px]">
                {recipient.slice(0, 10)}...{recipient.slice(-6)}
              </code>
              <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-800 pl-2">
                <SignatureIcon className="w-3.5 h-3.5" />
                <span>{signatureCount}/{threshold}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop-only Actions in Header */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          <div className="flex items-center gap-2">
            {canSign && !isReady && (
              <button
                onClick={(e) => { e.stopPropagation(); onSign(); }}
                disabled={isSigning}
                className="flex items-center justify-center gap-2 px-4 py-1.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <SignatureIcon className="w-4 h-4" />}
                Sign
              </button>
            )}
            {isReady && canExecute && (
              <button
                onClick={(e) => { e.stopPropagation(); onExecute(); }}
                disabled={isExecuting}
                className="flex items-center justify-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-500 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Execute
              </button>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDiscard(); }}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Expand Toggle Icon */}
        <div className="ml-2 p-1.5 rounded-lg group-hover:bg-zinc-800 transition-colors">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded Content (Details & Mobile Actions) */}
      {expanded && (
        <div className="px-4 pb-5 md:px-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="h-px w-full bg-zinc-800" />
          {/* Memo/Description Section */}
          {transaction.memo && (
            <div className="flex flex-col gap-2.5 p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed italic">
                "{transaction.memo}"
              </p>
            </div>
          )}

          {/* Recipient info for Mobile (only if hidden in header) */}
          <div className="md:hidden space-y-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recipient</span>
              <div className="flex items-center justify-between gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <code className="font-mono text-xs text-zinc-300 truncate">
                  {recipient}
                </code>
                <button
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(recipient); }}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {movePrice && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Value (USD)</span>
                <span className="text-zinc-300 font-medium">
                  ≈ ${(parseFloat(amount) / 100000000 * movePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Signature Progress (Visible in expanded view) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-1.5">
                <SignatureIcon className="w-3.5 h-3.5" />
                Signatures Received
              </div>
              <span className="text-zinc-200">{signatureCount} / {threshold} required</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isReady ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Mobile Actions section */}
          <div className="md:hidden flex flex-col gap-3 pt-2">
            {canSign && !isReady && (
              <button
                onClick={(e) => { e.stopPropagation(); onSign(); }}
                disabled={isSigning}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-white/5 cursor-pointer"
              >
                {isSigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <SignatureIcon className="w-5 h-5" />}
                Sign Transaction
              </button>
            )}
            {isReady && canExecute && (
              <button
                onClick={(e) => { e.stopPropagation(); onExecute(); }}
                disabled={isExecuting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-500 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-green-900/40 cursor-pointer"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-5 h-5" />}
                Execute Transaction
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-all cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
              Discard Transaction
            </button>
          </div>

          {/* Transaction Metadata (Existing) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-widest font-bold">
              <span>Security Details</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Transaction ID</span>
              <code className="font-mono text-[10px] md:text-sm bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                {transaction.id.slice(0, 16)}...
              </code>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Created At</span>
              <span className="text-zinc-300">
                {new Date(transaction.created_at).toLocaleString()}
              </span>
            </div>

            {signatures.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Signers</span>
                <div className="space-y-1.5">
                  {signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="flex items-center gap-3 text-xs p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30"
                    >
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <code className="font-mono flex-1 truncate text-zinc-400">
                        {sig.signer_address}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
