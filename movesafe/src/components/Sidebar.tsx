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
                <div className="p-6">
                    <Link href="/" className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white dark:text-slate-900" />
                        </div>
                        {!collapsed && (
                            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                MoveSafe
                            </span>
                        )}
                    </Link>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-10"
                >
                    {collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                        <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    )}
                </button>

                {/* Safe-specific nav */}
                {safeAddress && (
                    <div className="px-3 mb-2">
                        <Link
                            href="/safes"
                            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {!collapsed && <span className="text-sm font-medium">Back</span>}
                        </Link>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                    {(safeAddress ? safeNavItems : mainNavItems).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href, item.exact);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${collapsed ? 'justify-center' : ''}
                  ${active
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                                    }
                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {!collapsed && <span className="text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    {!collapsed && <ConnectionStatus />}

                    {connected && account ? (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 ${collapsed ? 'justify-center p-2' : ''}`}>
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                                        {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
                                    </p>
                                </div>
                            )}
                            {!collapsed && (
                                <button onClick={disconnect} className="text-slate-400 hover:text-red-500">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowWalletSelector(true)}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ${collapsed ? 'px-2' : ''}`}
                        >
                            <Wallet className="w-4 h-4" />
                            {!collapsed && <span>Connect Wallet</span>}
                        </button>
                    )}
                </div>
            </aside>

            <WalletSelector
                isOpen={showWalletSelector}
                onClose={() => setShowWalletSelector(false)}
            />
        </>
    );
}
