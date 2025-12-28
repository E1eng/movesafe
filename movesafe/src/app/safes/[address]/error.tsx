'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('❌ Safe page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Something Went Wrong
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {error.message || 'Failed to load safe'}
        </p>

        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-6">
          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
            {error.stack?.split('\n')[0]}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-medium"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
