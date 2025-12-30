'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
    Home,
    Shield,
    FileText,
    Plus,
    ChevronLeft,
    ChevronRight,
    Wallet,
    LayoutDashboard,
    Clock,
    ArrowLeft,
    LogOut,
} from 'lucide-react';
import { WalletSelector } from './WalletSelector';
import { ConnectionStatus } from './ConnectionStatus';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const pathname = usePathname();
    const { connected, account, disconnect } = useWallet();

    // Extract safe address from path
    const safeMatch = pathname.match(/\/safes\/([^\/\?]+)/);
    const safeAddress = safeMatch ? safeMatch[1] : null;

    // Navigation items based on context
    const mainNavItems = [
        { href: '/', icon: Home, label: 'Home', exact: true },
        { href: '/safes', icon: Shield, label: 'My Safes' },
        { href: '/drafts', icon: FileText, label: 'Drafts' },
        { href: '/create', icon: Plus, label: 'Create Safe' },
    ];

    const safeNavItems = safeAddress ? [
        { href: `/safes/${safeAddress}`, icon: LayoutDashboard, label: 'Overview', exact: true },
        { href: `/safes/${safeAddress}?tab=queue`, icon: Clock, label: 'Queue' },
        { href: `/safes/${safeAddress}?tab=history`, icon: FileText, label: 'History' },
        { href: `/safes/${safeAddress}?tab=safeguards`, icon: Shield, label: 'SafeGuards' },
    ] : [];

    const isActive = (href: string, exact?: boolean) => {
        const path = href.split('?')[0];
        if (exact) return pathname === path;
        return pathname.startsWith(path) && path !== '/';
    };

    return (
        <>
            <aside
                className={`
          sticky top-0 h-screen shrink-0
          bg-white dark:bg-slate-950 
          border-r border-slate-200 dark:border-slate-800
          transition-all duration-300 z-40 hidden lg:flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
        `}
            >
                {/* Logo */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <Link href="/" className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                MoveSafe
                            </span>
                        )}
                    </Link>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-16 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
                >
                    {collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                        <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    )}
                </button>

                {/* Safe-specific nav */}
                {safeAddress && (
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <Link
                            href="/safes"
                            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {!collapsed && <span className="text-sm">All Safes</span>}
                        </Link>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {/* Show safe nav if on safe page, otherwise main nav */}
                    {(safeAddress ? safeNavItems : mainNavItems).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href, item.exact);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${collapsed ? 'justify-center' : ''}
                  ${active
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }
                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Connection Status */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    {!collapsed && <ConnectionStatus />}
                </div>

                {/* Wallet Section */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    {connected && account ? (
                        <div className={`${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
                            <div className={`flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                {!collapsed && (
                                    <span className="text-sm font-mono text-slate-700 dark:text-slate-200 truncate">
                                        {account.address.toString().slice(0, 8)}...
                                    </span>
                                )}
                            </div>
                            {!collapsed && (
                                <button
                                    onClick={disconnect}
                                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Disconnect
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowWalletSelector(true)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all ${collapsed ? '' : ''}`}
                        >
                            <Wallet className="w-4 h-4" />
                            {!collapsed && <span>Connect</span>}
                        </button>
                    )}
                </div>

                {/* Safe address display */}
                {safeAddress && !collapsed && (
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Current Safe</p>
                            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                                {safeAddress.slice(0, 12)}...{safeAddress.slice(-6)}
                            </p>
                        </div>
                    </div>
                )}
            </aside>

            <WalletSelector
                isOpen={showWalletSelector}
                onClose={() => setShowWalletSelector(false)}
            />
        </>
    );
}
