'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    href: string;
  };
}

interface ToastInternal extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { badge: string; title: string }> = {
  default: { badge: 'bg-slate-400', title: 'text-slate-900' },
  success: { badge: 'bg-emerald-400', title: 'text-emerald-700' },
  error: { badge: 'bg-rose-400', title: 'text-rose-700' },
  warning: { badge: 'bg-amber-400', title: 'text-amber-700' },
  info: { badge: 'bg-blue-400', title: 'text-blue-700' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id =
        options.id ??
        (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}`);
      const duration = options.duration ?? 9000;

      setToasts((prev) => [
        ...prev,
        {
          ...options,
          id,
          duration,
          variant: options.variant ?? 'default',
          createdAt: Date.now(),
        },
      ]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-3 px-4 py-6 sm:py-8">
        {toasts.map((toastItem) => (
          <ToastCard key={toastItem.id} toast={toastItem} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, dismiss }: { toast: ToastInternal; dismiss: (id: string) => void }) {
  const variant = variantStyles[toast.variant ?? 'default'];

  return (
    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-white/5 dark:bg-slate-900/80">
      <div className="flex items-start gap-3 p-4">
        <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${variant.badge}`} />
        <div className="relative space-y-4 px-6 pb-6 pt-8 text-white">
          <div>
            <p className={`text-sm font-semibold leading-tight ${variant.title}`}>{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{toast.description}</p>
            )}
          </div>
          {toast.action && (
            <a
              href={toast.action.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
            >
              {toast.action.label}
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          className="ml-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="h-1 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-slate-900/60 via-slate-900 to-slate-900/60 dark:from-white/40 dark:via-white dark:to-white/40"
          style={{
            animation: `toast-progress ${toast.duration ?? 5000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
