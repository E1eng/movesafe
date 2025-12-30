'use client';

import React, { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[200px] p-4">
                    <Card className="max-w-md p-6 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                            Component Failed to Load
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => this.setState({ hasError: false })}
                        >
                            Retry
                        </Button>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
