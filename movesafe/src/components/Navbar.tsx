'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Wallet, Menu, X } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from './WalletSelector';
import { ConnectionStatus } from './ConnectionStatus';

export function Navbar() {
  const { connected, account, disconnect } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Show nav links on non-dashboard pages (landing, create, drafts)
  // Hide on /safes/* pages where sidebar handles navigation
  const showNavLinks = !pathname.startsWith('/safes/');

  // Check if on dashboard (has sidebar)
  const isOnDashboard = pathname.startsWith('/safes/');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="h-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                MoveSafe
              </span>
            </Link>

            {/* Desktop Navigation - only shown when NOT on dashboard */}
            {showNavLinks && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/safes"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/safes'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  My Safes
                </Link>
                <Link
                  href="/drafts"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/drafts'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  Drafts
                </Link>
                <Link
                  href="/create"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === '/create'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  Create
                </Link>
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              <ConnectionStatus />

              {connected && account ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-200">
                      {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletSelector(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                </button>
              )}

              {/* Mobile menu button */}
              {showNavLinks && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && showNavLinks && (
        <div className="md:hidden fixed inset-0 z-40 pt-16" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-0 right-0 top-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 space-y-1" onClick={e => e.stopPropagation()}>
            <Link href="/safes" className="block px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              My Safes
            </Link>
            <Link href="/drafts" className="block px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              Drafts
            </Link>
            <Link href="/create" className="block px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              Create Safe
            </Link>
          </div>
        </div>
      )}

      <WalletSelector
        isOpen={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
      />
    </>
  );
}
