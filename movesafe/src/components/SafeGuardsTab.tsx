'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { aptos } from '@/lib/movement';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useToast } from '@/components/ui/ToastProvider';

interface Allowance {
  beneficiary: string;
  daily_limit: number;
  current_spent: number;
  last_reset_time: number;
}

interface SafeGuardsTabProps {
  safeAddress: string;
  contractAddress: string;
  onSetLimit: () => void;
}

export function SafeGuardsTab({ safeAddress, contractAddress, onSetLimit }: SafeGuardsTabProps) {
  const { account } = useWallet();
  const { toast } = useToast();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    loadAllowances();
  }, [safeAddress, contractAddress]);

  const loadAllowances = async () => {
    setLoading(true);
    try {
      // Skip if contract not deployed (placeholder address)
      if (!contractAddress || contractAddress === '0x1' || contractAddress.length < 10) {
        setAllowances([]);
        return;
      }

      const result = await aptos.view({
        payload: {
          function: `${contractAddress}::spending_limit::get_all_allowances` as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [safeAddress],
        },
      });

      if (result && result[0]) {
        const allowanceData = result[0] as any[];
        setAllowances(allowanceData.map((a: any) => ({
          beneficiary: a.beneficiary,
          daily_limit: Number(a.daily_limit),
          current_spent: Number(a.current_spent),
          last_reset_time: Number(a.last_reset_time),
        })));
      } else {
        setAllowances([]);
      }
    } catch (err) {
      console.error('Error loading allowances:', err);
      setAllowances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantWithdraw = async (beneficiary: string, amount: number) => {
    if (!account) {
      toast({
        variant: 'warning',
        title: 'Connect wallet first',
        description: 'Only connected owners can trigger instant withdraw.',
      });
      return;
    }

    setWithdrawing(beneficiary);
    try {
      toast({
        variant: 'info',
        title: 'Instant withdraw coming soon',
        description: 'Feature will be available after the spending_limit contract is deployed.',
      });
      await loadAllowances();
    } catch (err: any) {
      console.error('Error withdrawing:', err);
      toast({
        variant: 'error',
        title: 'Withdrawal failed',
        description: err?.message || 'Unable to process instant withdraw.',
      });
    } finally {
      setWithdrawing(null);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (octas: number) => {
    return (octas / 100000000).toFixed(4);
  };

  const getTimeUntilReset = (lastResetTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastResetTime;
    const remaining = 86400 - elapsed;
    
    if (remaining <= 0) return 'Ready to reset';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    return `${hours}h ${minutes}m until reset`;
  };

  const getSpendingPercentage = (spent: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Loading SafeGuards...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Active Spending Limits
          </h3>
        </div>
        <button
          onClick={onSetLimit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Set New Limit
        </button>
      </div>

      {allowances.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No spending limits configured yet
          </p>
          <button
            onClick={onSetLimit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Set Your First Limit
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {allowances.map((allowance) => {
            const isUserBeneficiary = account?.address?.toString().toLowerCase() === allowance.beneficiary.toLowerCase();
            const remaining = allowance.daily_limit - allowance.current_spent;
            const percentage = getSpendingPercentage(allowance.current_spent, allowance.daily_limit);

            return (
              <div
                key={allowance.beneficiary}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-white dark:bg-slate-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                        {formatAddress(allowance.beneficiary)}
                      </span>
                      {isUserBeneficiary && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeUntilReset(allowance.last_reset_time)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {formatAmount(allowance.daily_limit)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      MOVE / day
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Spent Today</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatAmount(allowance.current_spent)} / {formatAmount(allowance.daily_limit)}
                    </span>
                  </div>

                  <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                        percentage >= 100
                          ? 'bg-red-500'
                          : percentage >= 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Remaining</span>
                    <span className={`font-semibold ${
                      remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatAmount(Math.max(0, remaining))} MOVE
                    </span>
                  </div>
                </div>

                {isUserBeneficiary && remaining > 0 && (
                  <button
                    onClick={() => handleInstantWithdraw(allowance.beneficiary, Math.min(remaining, allowance.daily_limit / 10))}
                    disabled={withdrawing === allowance.beneficiary}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {withdrawing === allowance.beneficiary ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        Instant Withdraw (No Approval Needed)
                      </>
                    )}
                  </button>
                )}

                {!isUserBeneficiary && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                    <CheckCircle className="w-4 h-4" />
                    <span>This beneficiary can withdraw instantly</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          How SafeGuards Work
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Set daily spending limits for trusted addresses via multisig approval</li>
          <li>Beneficiaries can instantly withdraw up to their limit without waiting</li>
          <li>Limits automatically reset every 24 hours</li>
          <li>Perfect for team members, automated systems, or regular expenses</li>
        </ul>
      </div>
    </div>
  );
}
