# MoveSafe 🛡️

> **The Native Multi-Signature Treasury for Movement Network.**
>
> 🔴 **[LIVE DEMO](https://movesafe.eleng.xyz)** | 📄 **[Documentation](https://docs.movementnetwork.xyz)**

MoveSafe is a next-generation multisig wallet built exclusively for the **Movement Network**. 

Unlike EVM-based solutions (e.g., Gnosis Safe), MoveSafe operates at the Account Level (L1). This eliminates the smart contract attack surface entirely—no contract logic bugs, no re-entrancy risks.

---

## 🚀 Why MoveSafe?

### 1. Hybrid Architecture (Best of Both Worlds)
*   **On-Chain Verification (Security)**: The blockchain is the ultimate source of truth. Funds are held in a native Account, not a contract. Transactions explicitly require K-of-N valid Ed25519 signatures to execute.
*   **Off-Chain Coordination (UX)**: We use a high-performance database layer to aggregate signatures and manage transaction drafts asynchronusly. This allows teams to coordinate without paying gas for every intermediate step.

---

## ✨ Key Features

### 🔐 Safe Management
*   **No-Contract Security**: By using MultiEd25519, auth logic is part of the L1 protocol.
*   **Drafts & Invites**:
    *   **Draft Mode**: Prepare a safe configuration before deploying.
    *   **Invite Links**: Share a unique URL (`/join/acb-123...`) to let co-owners join via their wallet. No manual address copying!
    *   **Auto-Inclusion**: The creator is automatically added as an owner to prevent lockouts.

### 💸 Asset Operations
*   **Asynchronous Signature Queue**: Owners can sign transactions whenever they are online. Once the threshold is met, anyone can trigger the final atomic execution.
*   **Real-Time Data**: Live MOVE/USD valuations and transaction status tracking.
*   **CSV Export**: Download audit-ready transaction history logs for accounting.
*   **Memo Support**: Attach on-chain messages to every transaction for clarity.

### 🎨 Premium UX
*   **Dark Mode**: Sleek, professional "Midnight" aesthetic using Tailwind CSS.
*   **Visual Feedback**: Toast notifications for every action (Success, Error, Info).
*   **Clean Console**: Zero console warnings/errors in production build.

---

## 🛠️ Project Structure

MoveSafe follows a modular **Feature-Based Architecture**:

```
movesafe/
├── src/app/                  # Next.js App Router (Routes)
│   ├── dashboard/            # Main Safe View (Balance, Queue, History)
│   ├── draft/[id]/           # Draft Management (Creator View)
│   ├── join/[id]/            # Invite Landing Page (Guest View)
│   ├── create/               # Manual Creation Flow
│   └── select/               # Safe Selection / Login
├── src/components/
│   ├── features/             # Business Logic Components
│   │   ├── dashboard/        # Transaction History, Queue
│   │   ├── safe/             # CreateSafeModal, SafeCard
│   │   ├── transaction/      # NewTransactionModal, QueueItem
│   │   └── wallet/           # WalletProvider, WalletSelector
│   └── ui/                   # Reusable UI (Buttons, Inputs, Cards)
├── src/lib/
│   ├── movement.ts           # Aptos SDK v5 Configuration
│   ├── multisig.ts           # Core MultiEd25519 Cryptography
│   └── supabase.ts           # RLS-Enabled Database Client
└── database/
    └── schema.sql            # Supabase Schema & RLS Policies
```

---

## 🏁 Getting Started

### Prerequisites
*   Node.js 18+
*   Supabase Project
*   Movement Wallet (Petra/Pontem)

### 1. Installation
```bash
git clone https://github.com/your-username/movesafe.git
cd movesafe
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root. 
> **Note**: You must have a `NEXT_PUBLIC_TREASURY_ADDRESS` to receive creation fees.

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Movement Network (Bardock Testnet)
NEXT_PUBLIC_MOVEMENT_NETWORK=custom
NEXT_PUBLIC_MOVEMENT_FULLNODE=https://aptos.testnet.bardock.movementlabs.xyz/v1
NEXT_PUBLIC_MOVEMENT_FAUCET=https://faucet.testnet.bardock.movementlabs.xyz/
NEXT_PUBLIC_MOVEMENT_CHAIN_ID=250

# Platform Config
NEXT_PUBLIC_TREASURY_ADDRESS=0x992d95...  # Wallet that collects creation fees
```

### 3. Database Setup
Run the SQL script located in `database/schema.sql` in your Supabase SQL Editor. This sets up:
*   Tables (`safes`, `transactions`, `safe_drafts`...)
*   **RLS Policies** (Critical for security)
*   Helper Functions (`is_safe_owner`, `finalize_safe_draft`)

### 4. Run Locally
```bash
npm run dev
# App active at http://localhost:3000
```

---

## �️ Security Model (Deep Dive)

MoveSafe implements a **"Don't Trust, Verify"** model:

1.  **Frontend**: Checks ownership via local wallet state.
2.  **Database (RLS)**: Checks `x-wallet-pubkey` header against the `owners` array in the database.
3.  **Blockchain**: The ultimate check. The Movement network will **reject** any transaction payload if the aggregated signature does not match the on-chain K-of-N policy.

**This means `movesafe` is non-custodial and trustless.** Even if the backend is compromised, funds cannot be stolen because private keys are never stored.

---

##  License

Open Source under [MIT](LICENSE).

Built with ❤️ for the **Movement Network Hackathon**.
