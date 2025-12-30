'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function ConnectionStatus() {
    const [status, setStatus] = useState<'connected' | 'slow' | 'disconnected'>('connected');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const checkConnection = async () => {
            const start = Date.now();
            try {
                // Ping a lightweight endpoint
                await fetch('https://fullnode.testnet.aptoslabs.com/v1', {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                const ms = Date.now() - start;
                setLatency(ms);
                setStatus(ms > 500 ? 'slow' : 'connected');
            } catch {
                setStatus('disconnected');
                setLatency(null);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    if (status === 'disconnected') {
        return (
            <Badge variant="danger" size="sm" dot pulse>
                <WifiOff className="w-3 h-3" />
                Offline
            </Badge>
        );
    }

    if (status === 'slow') {
        return (
            <Badge variant="warning" size="sm" dot>
                <Wifi className="w-3 h-3" />
                Slow
            </Badge>
        );
    }

    return (
        <Badge variant="success" size="sm" dot pulse>
            <Wifi className="w-3 h-3" />
            {latency ? `${latency}ms` : 'Online'}
        </Badge>
    );
}
