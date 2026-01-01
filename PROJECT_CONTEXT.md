# MOVESAFE PROJECT CONTEXT

## 1. Tech Stack
- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **Blockchain SDK:** `@aptos-labs/ts-sdk` (v1.9.0 or higher). **DO NOT** use the old `aptos` package.
- **Wallet Adapter:** `@aptos-labs/wallet-adapter-react`.
- **Backend/DB:** Supabase (PostgreSQL).
- **Network:** Movement (Bardock Testnet).
- **Styling:** `lucide-react` (icons), `shadcn/ui` (components).

## 2. Movement Network Configuration


SDK Reference (Cheat Sheet)
The @aptos-labs/ts-sdk syntax is strict. Use these patterns:

A. Generating MultiSig Address (Off-chain)

TypeScript

import { AccountAddress, MultiEd25519PublicKey, Ed25519PublicKey } from "@aptos-labs/ts-sdk";

// Convert hex strings to PublicKeys
const pks = ownersHexArray.map(hex => new Ed25519PublicKey(hex));

// Create MultiSig PK
const multiSigPk = new MultiEd25519PublicKey(pks, threshold);

// Derive Address
const authKey = multiSigPk.authKey();
const safeAddress = authKey.derivedAddress(); // Returns AccountAddress
B. Transaction Payload Structure

TypeScript

const payload = {
  function: "0x1::coin::transfer",
  typeArguments: ["0x1::aptos_coin::AptosCoin"],
  functionArguments: [recipientAddress, 1000000], // Amounts in Octas
};
C. Assembling MultiSig Signature (The hard part)

TypeScript

import { MultiEd25519Signature, Ed25519Signature } from "@aptos-labs/ts-sdk";

// 1. Map raw hex signatures from DB to Ed25519Signature objects
const signatures = dbSignatures.map(s => new Ed25519Signature(s.hex));

// 2. Create the Bitmap (Indices of owners who signed)
// If owners are [A, B, C] and A & C signed, bitmap is [0, 2]
const bitmap = [0, 2]; 

// 3. Create the Authenticator
const authenticator = new MultiEd25519Signature({ signatures, bitmap });
4. Database Schema (Supabase)
Assume these tables exist. Do not hallucinate other columns.

Table: safes

id (uuid, pk)

address (text, unique) - The calculated Multisig Address

name (text)

threshold (int2)

owners (text[]) - Array of owner wallet addresses

created_at (timestamptz)

Table: transactions

id (uuid, pk)

safe_address (text, fk -> safes.address)

payload (jsonb) - Stores { function, type_arguments, arguments }

status (text) - 'PENDING', 'EXECUTED', 'REJECTED'

sequence_number (int8) - Crucial for ordering on-chain

created_at (timestamptz)

Table: signatures

id (uuid, pk)

transaction_id (uuid, fk -> transactions.id)

signer_address (text)

signature_hex (text) - The raw signature string

5. Critical Logic Rules (Guardrails)
No On-Chain Safe Creation: A "Safe" is just an account. We "create" it simply by funding the derived address. No smart contract call needed to initialize it (unless rotating keys, which is out of scope for MVP).

Partially Signed Txs: Never submit a transaction to the chain unless signatures.length >= threshold.

Type Safety: Always treat u64 inputs (like coin amount) as strings or BigInt in TypeScript to avoid precision loss, then convert for SDK.


---

### 🔗 Link Referensi Eksternal (Untuk Verifikasi)
Jika Windsurf bingung, kamu bisa copas link ini ke chatnya:

1.  **Movement Network Docs:**
    'https://docs.movementnetwork.xyz/'
2.  **Movement Network Docs (RPC & Endpoints):**
    `https://docs.movementnetwork.xyz/devs/networkEndpoints`
3.  **Aptos TS SDK latest Documentation:**
    `https://aptos-labs.github.io/aptos-ts-sdk/@aptos-labs/ts-sdk-5.2.0/`
4.  **Aptos Wallet Adapter:**
    `https://github.com/aptos-labs/aptos-wallet-adapter`
5.   **Explorer:**
     'https://explorer.movementnetwork.xyz/?network=bardock+testnet'
