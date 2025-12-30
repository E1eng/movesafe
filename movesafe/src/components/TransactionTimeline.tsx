'use client';

import { Check, Clock, Send, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

type TransactionStatus = 'PENDING' | 'READY' | 'EXECUTING' | 'EXECUTED' | 'FAILED';

interface TransactionTimelineProps {
    status: TransactionStatus;
    signaturesRequired: number;
    signaturesCollected: number;
}

export function TransactionTimeline({
    status,
    signaturesRequired,
    signaturesCollected,
}: TransactionTimelineProps) {
    const steps = [
        {
            id: 'created',
            label: 'Created',
            description: 'Transaction proposed',
            completed: true,
        },
        {
            id: 'signatures',
            label: 'Signatures',
            description: `${signaturesCollected}/${signaturesRequired} collected`,
            completed: signaturesCollected >= signaturesRequired,
            active: signaturesCollected < signaturesRequired && status === 'PENDING',
        },
        {
            id: 'execution',
            label: 'Execution',
            description: status === 'EXECUTED' ? 'Completed' : 'Awaiting execution',
            completed: status === 'EXECUTED',
            active: status === 'EXECUTING' || (status === 'PENDING' && signaturesCollected >= signaturesRequired),
        },
    ];

    return (
        <div className="relative">
            {/* Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                        {/* Connector Line */}
                        {index > 0 && (
                            <div
                                className={`absolute h-0.5 top-4 transition-colors ${step.completed ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                style={{
                                    left: `${(index - 1) * 50 + 25}%`,
                                    width: '50%',
                                }}
                            />
                        )}

                        {/* Step Circle */}
                        <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.completed
                                    ? 'bg-green-500 text-white'
                                    : step.active
                                        ? 'bg-blue-500 text-white animate-pulse'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            {step.completed ? (
                                <Check className="w-4 h-4" />
                            ) : step.active ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Clock className="w-4 h-4" />
                            )}
                        </div>

                        {/* Label */}
                        <div className="mt-2 text-center">
                            <p className={`text-sm font-medium ${step.completed || step.active
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {step.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Status Badge Component
interface TransactionStatusBadgeProps {
    status: TransactionStatus;
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
    const configs: Record<TransactionStatus, { variant: 'success' | 'primary' | 'warning' | 'danger' | 'default'; label: string }> = {
        PENDING: { variant: 'primary', label: 'Pending' },
        READY: { variant: 'warning', label: 'Ready to Execute' },
        EXECUTING: { variant: 'warning', label: 'Executing...' },
        EXECUTED: { variant: 'success', label: 'Executed' },
        FAILED: { variant: 'danger', label: 'Failed' },
    };

    const config = configs[status] || configs.PENDING;

    return (
        <Badge variant={config.variant} size="sm" dot={status === 'EXECUTING'} pulse={status === 'EXECUTING'}>
            {config.label}
        </Badge>
    );
}
