/**
 * Transaction simulation hook
 * Simulates transactions before signing to show expected outcomes
 */

import { useState, useCallback } from 'react';
import { aptos } from '@/lib/movement';

interface SimulationResult {
    success: boolean;
    gasUsed?: number;
    changes?: string[];
    error?: string;
}

interface UseTransactionSimulationReturn {
    simulate: (txnPayload: {
        sender: string;
        function: string;
        typeArguments: string[];
        functionArguments: (string | number | boolean | Uint8Array)[];
    }) => Promise<SimulationResult>;
    isSimulating: boolean;
    lastResult: SimulationResult | null;
}

export function useTransactionSimulation(): UseTransactionSimulationReturn {
    const [isSimulating, setIsSimulating] = useState(false);
    const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

    const simulate = useCallback(async (txnPayload: {
        sender: string;
        function: string;
        typeArguments: string[];
        functionArguments: (string | number | boolean | Uint8Array)[];
    }): Promise<SimulationResult> => {
        setIsSimulating(true);
        try {
            // Build a preview transaction
            const rawTxn = await aptos.transaction.build.simple({
                sender: txnPayload.sender,
                data: {
                    function: txnPayload.function as `${string}::${string}::${string}`,
                    typeArguments: txnPayload.typeArguments,
                    functionArguments: txnPayload.functionArguments,
                },
            });

            // Simulate the transaction
            const [simulationResult] = await aptos.transaction.simulate.simple({
                transaction: rawTxn,
                signerPublicKey: undefined, // Will use sender's public key if available
            });

            if (!simulationResult.success) {
                const result: SimulationResult = {
                    success: false,
                    error: simulationResult.vm_status || 'Transaction simulation failed',
                };
                setLastResult(result);
                return result;
            }

            const result: SimulationResult = {
                success: true,
                gasUsed: Number(simulationResult.gas_used),
                changes: simulationResult.changes?.map((change) => {
                    if ('type' in change) {
                        return `${change.type}: ${JSON.stringify(change).slice(0, 100)}`;
                    }
                    return JSON.stringify(change).slice(0, 100);
                }),
            };

            setLastResult(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            const result: SimulationResult = {
                success: false,
                error: `Simulation failed: ${error}`,
            };
            setLastResult(result);
            return result;
        } finally {
            setIsSimulating(false);
        }
    }, []);

    return {
        simulate,
        isSimulating,
        lastResult,
    };
}
