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
} as const;

export const aptosConfig = new AptosConfig({
  // Movement/Bardock is a non-Aptos network, so we use CUSTOM.
  network: Network.CUSTOM,
  fullnode: MOVEMENT_CONFIG.fullnode,
});

export const aptos = new Aptos(aptosConfig);
