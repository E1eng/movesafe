'use client';

import { Check, Clock, Pen, Play, XCircle } from 'lucide-react';

type TransactionStatus = 'PENDING' | 'EXECUTED' | 'FAILED' | 'DISCARDED';

interface TransactionTimelineProps {
    status: TransactionStatus;
    currentSignatures: number;
    requiredSignatures: number;
    createdAt?: string;
    executedAt?: string;
}

export function TransactionTimeline({
    status,
    currentSignatures,
    requiredSignatures,
    createdAt,
    executedAt,
}: TransactionTimelineProps) {
    const steps = [
        {
            id: 'created',
            label: 'Created',
            icon: Clock,
            completed: true,
            timestamp: createdAt,
        },
        {
            id: 'signed',
            label: `Signed (${currentSignatures}/${requiredSignatures})`,
            icon: Pen,
            completed: currentSignatures >= requiredSignatures,
            active: currentSignatures > 0 && currentSignatures < requiredSignatures,
        },
        {
            id: 'executed',
            label: status === 'FAILED' ? 'Failed' : status === 'DISCARDED' ? 'Discarded' : 'Executed',
            icon: status === 'FAILED' || status === 'DISCARDED' ? XCircle : status === 'EXECUTED' ? Check : Play,
            completed: status === 'EXECUTED',
            failed: status === 'FAILED' || status === 'DISCARDED',
            timestamp: executedAt,
        },
    ];

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === steps.length - 1;

                let bgColor = 'bg-slate-200 dark:bg-slate-700';
                let textColor = 'text-slate-400 dark:text-slate-500';
                let iconBg = 'bg-slate-100 dark:bg-slate-800';

                if (step.failed) {
                    bgColor = 'bg-red-500';
                    textColor = 'text-red-500';
                    iconBg = 'bg-red-100 dark:bg-red-900/30';
                } else if (step.completed) {
                    bgColor = 'bg-green-500';
                    textColor = 'text-green-500';
                    iconBg = 'bg-green-100 dark:bg-green-900/30';
                } else if (step.active) {
                    bgColor = 'bg-blue-500';
                    textColor = 'text-blue-500';
                    iconBg = 'bg-blue-100 dark:bg-blue-900/30';
                }

                return (
                    <div key={step.id} className="flex items-center">
                        {/* Step icon */}
                        <div
                            className={`relative flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${iconBg}`}
                            title={step.timestamp ? new Date(step.timestamp).toLocaleString() : step.label}
                        >
                            <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${textColor}`} />
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                            <div
                                className={`w-4 sm:w-8 h-0.5 ${step.completed ? 'bg-green-500' : bgColor
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Compact version for list items
 */
export function TransactionStatusBadge({
    status,
    currentSignatures,
    requiredSignatures,
}: {
    status: TransactionStatus;
    currentSignatures: number;
    requiredSignatures: number;
}) {
    const config = {
        PENDING: {
            bg: currentSignatures >= requiredSignatures
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            text: currentSignatures >= requiredSignatures
                ? 'Ready to Execute'
                : `${currentSignatures}/${requiredSignatures} Signed`,
        },
        EXECUTED: {
            bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            text: 'Executed',
        },
        FAILED: {
            bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            text: 'Failed',
        },
        DISCARDED: {
            bg: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
            text: 'Discarded',
        },
    };

    const { bg, text } = config[status] || config.PENDING;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg}`}>
            {text}
        </span>
    );
}
