'use client';

import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  tone?: 'default' | 'danger';
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
  tone = 'default',
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 shadow-[0_25px_70px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />
        <div className="relative space-y-4 px-6 pb-6 pt-8 text-white">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Confirm action</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight">{title}</h3>
            {description && <p className="mt-2 text-base text-white/70">{description}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${
                tone === 'danger'
                  ? 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-400'
                  : 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500'
              }`}
            >
              {busy ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
