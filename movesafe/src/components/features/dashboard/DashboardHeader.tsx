import { Menu, Plus } from 'lucide-react';
import { DashboardHeaderProps } from '@/types/dashboard';

export function DashboardHeader({ balance, movePrice, onNewTransaction, onMobileMenuOpen }: DashboardHeaderProps) {
    return (
        <div className="h-auto md:h-20 min-h-[5rem] flex items-center justify-between px-6 md:px-8 border-b border-zinc-800 z-20 bg-zinc-950 pt-safe pt-4 pb-4 md:pt-0 md:pb-0 sticky top-0">
            <div className="flex items-center gap-4">
                {/* Mobile Hamburger */}
                <button
                    onClick={onMobileMenuOpen}
                    className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white cursor-pointer"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="min-w-0">
                    <h1 className="text-xs font-medium text-zinc-400">Total Balance</h1>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap">
                            {balance.toLocaleString('en-US', { minimumFractionDigits: 4 })} <span className="text-sm font-normal text-zinc-400">MOVE</span>
                        </p>
                        {movePrice && (
                            <span className="text-xs text-zinc-200 whitespace-nowrap">
                                ≈ ${(balance * movePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={onNewTransaction}
                className="flex items-center gap-2 bg-white text-black px-3 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
            >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">New Transaction</span>
                <span className="md:hidden">New Transaction</span>
            </button>
        </div>
    );
}
