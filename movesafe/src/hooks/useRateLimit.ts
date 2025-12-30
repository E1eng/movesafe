/**
 * Rate limiting hook for transaction creation
 * Prevents spam by enforcing minimum time between transaction creations
 */

import { useState, useCallback, useEffect } from 'react';

const RATE_LIMIT_KEY_PREFIX = 'movesafe_rate_limit_';
const MIN_INTERVAL_MS = 10000; // 10 seconds between transactions

interface RateLimitState {
    isRateLimited: boolean;
    remainingSeconds: number;
    checkRateLimit: () => boolean;
    recordAction: () => void;
}

export function useRateLimit(safeAddress: string): RateLimitState {
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const storageKey = `${RATE_LIMIT_KEY_PREFIX}${safeAddress}`;

    // Check if rate limited on mount and when address changes
    useEffect(() => {
        const checkRemaining = () => {
            const lastAction = localStorage.getItem(storageKey);
            if (!lastAction) {
                setRemainingSeconds(0);
                return;
            }

            const elapsed = Date.now() - parseInt(lastAction, 10);
            const remaining = Math.max(0, MIN_INTERVAL_MS - elapsed);
            setRemainingSeconds(Math.ceil(remaining / 1000));
        };

        checkRemaining();
        const interval = setInterval(checkRemaining, 1000);
        return () => clearInterval(interval);
    }, [storageKey]);

    const checkRateLimit = useCallback((): boolean => {
        const lastAction = localStorage.getItem(storageKey);
        if (!lastAction) return false;

        const elapsed = Date.now() - parseInt(lastAction, 10);
        return elapsed < MIN_INTERVAL_MS;
    }, [storageKey]);

    const recordAction = useCallback(() => {
        localStorage.setItem(storageKey, Date.now().toString());
        setRemainingSeconds(Math.ceil(MIN_INTERVAL_MS / 1000));
    }, [storageKey]);

    return {
        isRateLimited: remainingSeconds > 0,
        remainingSeconds,
        checkRateLimit,
        recordAction,
    };
}
