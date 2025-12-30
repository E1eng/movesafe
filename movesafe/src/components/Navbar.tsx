'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Wallet, Menu, X } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from './WalletSelector';
import { ConnectionStatus } from './ConnectionStatus';

export function Navbar() {
  const { connected, account, disconnect } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
        <div className="h-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                MoveSafe
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/safes"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                My Safes
              </Link>
              <Link
                href="/drafts"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Drafts
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Create
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <ConnectionStatus />

              {connected && account ? (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-200">
                      {account.address.toString().slice(0, 6)}...
                      {account.address.toString().slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletSelector(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="p-4 space-y-2">
              <Link
                href="/safes"
                className="block px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Safes
              </Link>
              <Link
                href="/drafts"
                className="block px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Drafts
              </Link>
              <Link
                href="/create"
                className="block px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create
              </Link>

              {connected && account ? (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                    Connected: {account.address.toString().slice(0, 10)}...
                  </div>
                  <button
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowWalletSelector(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
      />
    </>
  );
}
