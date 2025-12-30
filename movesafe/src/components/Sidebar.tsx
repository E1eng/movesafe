'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Shield,
    FileText,
    Plus,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Clock,
    Settings,
    Users,
} from 'lucide-react';

interface SidebarProps {
    safeAddress?: string;
}

export function Sidebar({ safeAddress }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    // Global navigation items (when not on a safe page)
    const globalNavItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/safes', icon: Shield, label: 'My Safes' },
        { href: '/drafts', icon: FileText, label: 'Drafts' },
        { href: '/create', icon: Plus, label: 'Create Safe' },
    ];

    // Safe-specific navigation items (when on a safe page)
    const safeNavItems = safeAddress
        ? [
            { href: `/safes/${safeAddress}`, icon: LayoutDashboard, label: 'Overview', exact: true },
            { href: `/safes/${safeAddress}?tab=queue`, icon: Clock, label: 'Queue' },
            { href: `/safes/${safeAddress}?tab=history`, icon: FileText, label: 'History' },
            { href: `/safes/${safeAddress}?tab=safeguards`, icon: Shield, label: 'SafeGuards' },
            { href: `/safes/${safeAddress}?tab=owners`, icon: Users, label: 'Owners' },
            { href: `/safes/${safeAddress}?tab=settings`, icon: Settings, label: 'Settings' },
        ]
        : [];

    const navItems = safeAddress ? safeNavItems : globalNavItems;

    const isActive = (href: string, exact?: boolean) => {
        if (exact) {
            return pathname === href.split('?')[0];
        }
        return pathname.startsWith(href.split('?')[0]);
    };

    return (
        <aside
            className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] 
        bg-white dark:bg-slate-800 
        border-r border-slate-200 dark:border-slate-700
        transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-64'}
      `}
        >
            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
                {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                )}
            </button>

            {/* Back to safes link when on safe page */}
            {safeAddress && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <Link
                        href="/safes"
                        className={`
              flex items-center gap-3 text-slate-600 dark:text-slate-400 
              hover:text-slate-900 dark:hover:text-slate-100
              ${collapsed ? 'justify-center' : ''}
            `}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {!collapsed && <span className="text-sm font-medium">All Safes</span>}
                    </Link>
                </div>
            )}

            {/* Navigation items */}
            <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, (item as { exact?: boolean }).exact);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${collapsed ? 'justify-center' : ''}
                ${active
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                                }
              `}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Safe info when on safe page */}
            {safeAddress && !collapsed && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Safe Address</div>
                    <div className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                        {safeAddress}
                    </div>
                </div>
            )}
        </aside>
    );
}
