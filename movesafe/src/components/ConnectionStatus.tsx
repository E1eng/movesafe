'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { aptos } from '@/lib/movement';

type ConnectionState = 'connected' | 'slow' | 'disconnected';

export function ConnectionStatus() {
    const [state, setState] = useState<ConnectionState>('connected');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const checkConnection = async () => {
            const startTime = Date.now();
            try {
                await aptos.getLedgerInfo();
                const elapsed = Date.now() - startTime;
                setLatency(elapsed);
                setState(elapsed > 3000 ? 'slow' : 'connected');
            } catch {
                setState('disconnected');
                setLatency(null);
            }
        };

        // Initial check
        checkConnection();

        // Check every 30 seconds
        const interval = setInterval(checkConnection, 30000);

        // Also check on online/offline events
        const handleOnline = () => checkConnection();
        const handleOffline = () => setState('disconnected');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const config = {
        connected: {
            icon: Wifi,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            text: 'Connected',
        },
        slow: {
            icon: AlertCircle,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            text: 'Slow',
        },
        disconnected: {
            icon: WifiOff,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            text: 'Offline',
        },
    };

    const { icon: Icon, color, bg, text } = config[state];

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${color} ${bg}`}
            title={latency ? `Latency: ${latency}ms` : 'Network status'}
        >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{text}</span>
            {latency && state === 'connected' && (
                <span className="text-[10px] opacity-70">{latency}ms</span>
            )}
        </div>
    );
}
