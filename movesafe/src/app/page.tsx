import Link from 'next/link';
import { Shield, Plus, Wallet } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8 rounded-full bg-blue-100 dark:bg-blue-900/20 p-6">
            <Shield className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-slate-900 dark:text-slate-50">
            MoveSafe
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl">
            Secure multisig wallet for Movement Network. Manage your digital assets with 
            multi-signature protection using native MultiEd25519 accounts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/create"
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Safe
            </Link>
            
            <Link
              href="/safes"
              className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Wallet className="w-5 h-5" />
              View My Safes
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
                Native Multisig
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Uses Movement's native MultiEd25519 accounts. No smart contracts required.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
                K-of-N Signatures
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Flexible threshold signatures. Require K signatures from N owners.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
                Off-Chain Coordination
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Collect signatures off-chain, submit when threshold is reached.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
