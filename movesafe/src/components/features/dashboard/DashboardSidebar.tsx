import {
    History, CheckCircle2, Coins, Users, Wallet, Copy, LogOut, LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Tab, DashboardSidebarProps } from '@/types/dashboard';

const NavItem = ({ id, label, icon: Icon, activeTab, onSelect }: { id: Tab, label: string, icon: LucideIcon, activeTab: Tab, onSelect: (id: Tab) => void }) => (
    <button
        onClick={() => onSelect(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${activeTab === id
            ? 'bg-white text-black font-medium shadow-md shadow-white/5'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);

export function DashboardSidebar({ safe, safeAddress, activeTab, onSwitchTab, onBack }: DashboardSidebarProps) {
    return (
        <div className="hidden md:flex w-[260px] flex-col border-r border-zinc-800 p-6 bg-zinc-900">
            {/* Safe Header */}
            <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-transparent flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-92x92.png" alt="Safe Logo" className="w-full h-full object-cover" />
                </div>
                <h2 className="font-bold text-xl mb-1">{safe.name}</h2>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(safeAddress);
                        toast.success("Address copied");
                    }}
                    className="flex items-center gap-2 text-sm font-mono text-zinc-400 hover:text-zinc-300 transition-colors bg-zinc-700/50 px-2 py-1 rounded-md w-fit cursor-pointer"
                >
                    {safeAddress.slice(0, 8)}...{safeAddress.slice(-6)}
                    <Copy className="w-3 h-3" />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 space-y-1">
                <NavItem id="queue" label="Queue" icon={History} activeTab={activeTab} onSelect={onSwitchTab} />
                <NavItem id="history" label="History" icon={CheckCircle2} activeTab={activeTab} onSelect={onSwitchTab} />
                <NavItem id="assets" label="Assets" icon={Coins} activeTab={activeTab} onSelect={onSwitchTab} />
                <NavItem id="signers" label="Owners" icon={Users} activeTab={activeTab} onSelect={onSwitchTab} />
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-800">
                <button
                    onClick={onBack}
                    className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 transition-colors text-sm font-medium cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Exit Safe
                </button>
            </div>
        </div>
    );
}
