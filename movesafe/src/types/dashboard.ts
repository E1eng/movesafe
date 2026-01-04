import { Transaction, Signature, Safe } from '@/lib/supabase';

export type Tab = 'queue' | 'history' | 'assets' | 'signers' | 'settings';

export interface ExtendedTransaction extends Transaction {
    signatures: Signature[];
}

export interface DashboardSidebarProps {
    safe: Safe;
    safeAddress: string;
    activeTab: Tab;
    onSwitchTab: (tab: Tab) => void;
    onBack: () => void;
}

export interface DashboardHeaderProps {
    balance: number;
    movePrice: number | null;
    onNewTransaction: () => void;
    onMobileMenuOpen: () => void;
}
