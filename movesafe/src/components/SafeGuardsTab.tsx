'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Shield, RefreshCw } from 'lucide-react';
import { aptos } from '@/lib/movement';

interface Allowance {
  beneficiary: string;
  daily_limit: string | number;
  current_spent: string | number;
  last_reset_time: string | number;
}

interface SafeGuardsTabProps {
  safeAddress: string;
  contractAddress: string;
}

export function SafeGuardsTab({ safeAddress, contractAddress }: SafeGuardsTabProps) {
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [allowances, setAllowances] = useState<Allowance[]>([]);

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
        const allowanceData = result[0] as Allowance[];
        setAllowances(allowanceData.map((a) => ({
          beneficiary: a.beneficiary,
          daily_limit: Number(a.daily_limit),
          current_spent: Number(a.current_spent),
          last_reset_time: Number(a.last_reset_time),
        })));
      } else {
        setAllowances([]);
      }
    } catch (err) {
      console.error('Failed to load allowances:', err);
      // Fail silently for now as the contract might not be initialized
      setAllowances([]);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (octas: string | number) => {
    return (Number(octas) / 100000000).toFixed(2);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Spending Limits
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Allow specific addresses to withdraw daily amounts without multisig approval.
          </p>
        </div>
        <button
          onClick={loadAllowances}
          disabled={loading}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {allowances.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No active spending limits found.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {allowances.map((allowance, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                <div>
                  <div className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatAddress(allowance.beneficiary)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Spent today: {formatAmount(allowance.current_spent)} MOVE
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatAmount(allowance.daily_limit)} MOVE
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Daily Limit
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Instant Withdraw
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
          If you are a beneficiary with an active allowance, you can withdraw funds instantly without waiting for owners to sign.
        </p>
        <button
          disabled
          className="px-4 py-2 bg-blue-600/50 text-white rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Withdraw (Coming Soon)
        </button>
      </div>
    </div>
  );
}
