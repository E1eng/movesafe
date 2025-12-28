'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Wallet } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from './WalletSelector';

export function Navbar() {
  const { connected, account, disconnect } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  return (
    <>
      <nav className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                MoveSafe
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/safes"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              >
                Safes
              </Link>
              <Link
                href="/drafts"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              >
                Drafts
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              >
                Create
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {connected && account ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-mono text-slate-900 dark:text-slate-50">
                      {account.address.toString().slice(0, 6)}...
                      {account.address.toString().slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowWalletSelector(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
      />
    </>
  );
}
