import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const MOVEMENT_CONFIG = {
  network: (process.env.NEXT_PUBLIC_MOVEMENT_NETWORK || 'custom').toLowerCase(),
  fullnode:
    process.env.NEXT_PUBLIC_MOVEMENT_FULLNODE ||
    'https://testnet.movementnetwork.xyz/v1',
  faucet:
    process.env.NEXT_PUBLIC_MOVEMENT_FAUCET ||
    'https://faucet.testnet.movementnetwork.xyz/',
  chainId: Number(process.env.NEXT_PUBLIC_MOVEMENT_CHAIN_ID || '250'),
  fallbackFullnodes: (process.env.NEXT_PUBLIC_MOVEMENT_FALLBACK_FULLNODES || '')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0),
} as const;

const fullnodePool = Array.from(
  new Set([MOVEMENT_CONFIG.fullnode, ...MOVEMENT_CONFIG.fallbackFullnodes])
).filter(Boolean);

export interface AptosClientEntry {
  fullnode: string;
  client: Aptos;
}

export const aptosClients: AptosClientEntry[] = fullnodePool.map((nodeUrl) => ({
  fullnode: nodeUrl,
  client: new Aptos(
    new AptosConfig({
      network: Network.CUSTOM,
      fullnode: nodeUrl,
    })
  ),
}));

export const aptos = aptosClients[0]?.client;
export const movementFullnodePool = fullnodePool;

export function getAptosClient(index = 0) {
  return aptosClients[index]?.client ?? aptosClients[0]?.client;
}

export async function withMovementClient<T>(
  operation: string,
  fn: (client: Aptos, meta: { fullnode: string; index: number }) => Promise<T>
): Promise<T> {
  if (!aptosClients.length) {
    throw new Error('No Movement RPC clients configured');
  }

  let lastError: any = null;
  for (let i = 0; i < aptosClients.length; i += 1) {
    const entry = aptosClients[i];
    try {
      return await fn(entry.client, { fullnode: entry.fullnode, index: i });
    } catch (err: any) {
      lastError = err;
      if (i === aptosClients.length - 1) {
        break;
      }
      console.warn(
        `[Movement RPC] ${operation} failed via ${entry.fullnode}. Trying fallback...`,
        err
      );
    }
  }
  throw lastError ?? new Error(`[Movement RPC] ${operation} failed on all fullnodes`);
}
