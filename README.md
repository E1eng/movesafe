# MoveSafe 🛡️

> **Secure, Native Multi-Signature Treasury Management for the Movement Network.**
>
> 🔴 **[LIVE DEMO](https://movesafe.eleng.xyz)**

MoveSafe is a next-generation multisig wallet built exclusively for the **Movement Network**. Unlike traditional multisig solutions that rely on complex and potentially vulnerable smart contracts, MoveSafe leverages movements native **MultiEd25519** authentication scheme. This means better security, lower gas fees, and clearer on-chain transparency.

## 🚀 Why MoveSafe?

- **Native Security**: Uses the blockchain's built-in cryptographic primitives (MultiEd25519) instead of custom smart contract logic.
- **Gas Efficient**: No heavy contract deployment required to create a Safe.
- **Off-Chain Coordination**: Signatures are gathered off-chain via Supabase, meaning you only pay gas when executing the final transaction.
- **Seamless UX**: Designed with a modern aesthetic—clean, dark mode, and responsive.

## ✨ Key Features

- **Create Safes instantly**: define owners and threshold (K-of-N).
- **Activation & Fee**: One-step Safe activation with automated creation fee (1 MOVE).
- **Asset Dashboard**: View MOVE token balance and USD valuation in real-time.
- **Transaction Queue**: Propose transactions, collect signatures asynchronously, and execute when ready.
- **Contextual Memos**: Attach text messages to transactions for clear record-keeping.
- **Shareable Links**: Easily invite other owners by sharing the Safe URL.
- **Transaction History**: Full history of executed transactions with CSV export capability.
- **Visual Clarity**: Beautiful empty states and clear status indicators.

## � Security & Architecture

MoveSafe prioritizes security by adhering to a **"Don't Trust, Verify"** model.

### 1. Non-Custodial & Trustless
- **No Private Keys Stored**: MoveSafe *never* has access to your private keys. Signing happens locally in your wallet (Petra/Pontem).
- **On-Chain Verification**: The Movement Blockchain is the ultimate source of truth. It verifies every signature against the on-chain public keys before executing any transaction.

### 2. The Role of Supabase (Off-Chain Coordination)
Values are stored in Supabase only to coordinate the multi-signature process efficiently:
- **Gas Saving**: Instead of every owner submitting their signature on-chain (paying gas N times), signatures are collected off-chain.
- **Atomic Execution**: Once the threshold is met, *any* owner can submit the final transaction with all attached signatures in a single on-chain interaction.
- **Safety**: Even if the Supabase database were compromised, an attacker **cannot** steal funds because they do not possess the private keys required to generate valid signatures for the blockchain.

### 3. Database Schema
For a detailed look at the off-chain coordination tables, please refer to the [Database Schema](database/schema.sql).

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Blockchain SDK**: [@aptos-labs/ts-sdk](https://github.com/aptos-labs/aptos-ts-sdk)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) for off-chain coordination
- **Network**: [Movement Network](https://movementlabs.xyz/) (Bardock Testnet)

## 📖 How it Works

1.  **Create a Safe**: Define owners and a threshold (e.g., 2-of-3).
    *   *System automatically funds & activates the Safe account involved.*
2.  **Propose a Transaction**: Any owner can create a proposal (e.g., "Send 10 MOVE to Alice").
3.  **Collect Signatures**:
    *   The proposal appears in the **Queue** for all owners.
    *   Other owners connect their wallets and click "Sign".
    *   Signatures are stored off-chain (gasless).
4.  **Execute**: Once the threshold is reached (e.g., 2 signatures), **any** owner can click "Execute".
    *   This submits the single transaction to the Movement Network.
    *   Gas is paid only once.

## 🏁 Getting Started

Follow these steps to run MoveSafe locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/movesafe.git
   cd movesafe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory and add your Supabase credentials. A template is available in `example.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Movement Network Config (Defaults provided in example.env)
   NEXT_PUBLIC_MOVEMENT_NETWORK=custom
   NEXT_PUBLIC_MOVEMENT_FULLNODE=https://testnet.movementnetwork.xyz/v1
   NEXT_PUBLIC_MOVEMENT_FAUCET=https://faucet.testnet.movementnetwork.xyz/
   NEXT_PUBLIC_MOVEMENT_CHAIN_ID=250
   
   # Treasury Config (For Safe Creation Fee)
   NEXT_PUBLIC_TREASURY_ADDRESS=0xYourTreasuryAddress
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   # App runs on http://localhost:4000
   ```

## 🗺️ Roadmap

- [ ] **Transaction Simulation**: Preview balance changes before signing.
- [ ] **Address Book**: Manage frequent contacts and owner aliases.
- [ ] **Safe Settings**: On-chain threshold rotation and owner management.
- [ ] **Mainnet Launch**: Deploy to Movement Mainnet.

## � License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ for the Movement Network Hackathon.
