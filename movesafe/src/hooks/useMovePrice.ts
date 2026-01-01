import { useState, useEffect } from 'react';

// Global cache to prevent multiple components from fetching simultaneously
let globalPrice: number | null = null;
let globalPromise: Promise<number | null> | null = null;
const listeners: Set<(price: number | null) => void> = new Set();

export function useMovePrice() {
    const [price, setPrice] = useState<number | null>(globalPrice);
    const [loading, setLoading] = useState<boolean>(!globalPrice);

    useEffect(() => {
        // Subscribe to updates
        const listener = (newPrice: number | null) => {
            setPrice(newPrice);
            setLoading(false);
        };
        listeners.add(listener);

        // Fetch if needed
        const fetchPrice = async () => {
            if (globalPrice !== null) {
                setLoading(false);
            }

            if (!globalPromise) {
                globalPromise = (async () => {
                    try {
                        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=movement&vs_currencies=usd');
                        if (!res.ok) throw new Error('Network response was not ok');
                        const data = await res.json();
                        if (data?.movement?.usd) {
                            globalPrice = data.movement.usd;
                            return globalPrice;
                        }
                    } catch (e) {
                        // Silent fail, just return null. No mock data.
                    }
                    return globalPrice;
                })();

                // Reset promise after 10s to allow retrying
                setTimeout(() => { globalPromise = null; }, 10000);
            }

            try {
                const result = await globalPromise;
                if (result !== null) {
                    listeners.forEach(l => l(result));
                }
            } catch (e) {
                console.error("Error awaiting price promise", e);
            }
        };

        // Initial fetch
        if (globalPrice === null) {
            fetchPrice();
        }

        // Poll every minute
        const interval = setInterval(() => {
            fetchPrice();
        }, 60_000);

        return () => {
            listeners.delete(listener);
            clearInterval(interval);
        };
    }, []);

    return { price, loading };
}
