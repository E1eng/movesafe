# MoveSafe 🛡️

> **Secure, Native Multi-Signature Treasury Management for the Movement Network.**

MoveSafe is a next-generation multisig wallet built exclusively for the **Movement Network**. Unlike traditional multisig solutions that rely on complex and potentially vulnerable smart contracts, MoveSafe leverages Aptos's native **MultiEd25519** authentication scheme. This means better security, lower gas fees, and clearer on-chain transparency.

## 🚀 Why MoveSafe?

- **Native Security**: Uses the blockchain's built-in cryptographic primitives (MultiEd25519) instead of custom smart contract logic.
- **Gas Efficient**: No heavy contract deployment required to create a Safe.
- **Off-Chain Coordination**: Signatures are gathered off-chain via Supabase, meaning you only pay gas when executing the final transaction.
- **Seamless UX**: Designed with a "startup-grade" aesthetic—clean, dark mode, and responsive.

## ✨ Key Features

- **Create Safes instantly**: define owners and threshold (K-of-N).
- **Asset Dashboard**: View MOVE token balance and USD valuation in real-time.
- **Transaction Queue**: Propose transactions, collect signatures asynchronously, and execute when ready.
- **Transaction History**: Full history of executed transactions with CSV export capability.
- **Visual Clarity**: Beautiful empty states and clear status indicators.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Blockchain SDK**: [@aptos-labs/ts-sdk](https://github.com/aptos-labs/aptos-ts-sdk)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL) for off-chain coordination
- **Network**: [Movement Network](https://movementlabs.xyz/) (Bardock Testnet)

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
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *Note: Ensure your Supabase database has the `safes`, `transactions`, and `signatures` tables set up.*

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open locally**
   Visit [http://localhost:3000](http://localhost:3000) to start managing your assets.

## 📸 Screenshots

*(Add your screenshots here: Dashboard, Create Transaction, History)*

---

Built with ❤️ for the Movement Network Hackathon.
