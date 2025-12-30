'use client';

/**
 * Loading skeleton for transaction list
 */
export function TransactionSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 animate-pulse"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            {/* Title skeleton */}
                            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            {/* Status badge skeleton */}
                            <div className="flex items-center gap-2">
                                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                            </div>
                        </div>
                        {/* Button skeleton */}
                        <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Loading skeleton for safe info card
 */
export function SafeInfoSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse space-y-4">
            {/* Title */}
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            {/* Balance */}
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            {/* Address */}
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            {/* Owners */}
            <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
        </div>
    );
}

/**
 * Generic content skeleton
 */
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
                    style={{ width: `${100 - i * 15}%` }}
                />
            ))}
        </div>
    );
}
