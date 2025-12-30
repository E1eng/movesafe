'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Clock, Coins, User, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SetLimitModal } from './SetLimitModal';
import { aptos, MOVEMENT_CONFIG } from '@/lib/movement';

interface SpendingLimit {
  beneficiary: string;
  dailyLimit: number;
  spent: number;
  lastReset: number;
}

interface SafeGuardsTabProps {
  safeAddress: string;
  onSetLimit: (beneficiary: string, limit: string) => Promise<void>;
}

export function SafeGuardsTab({ safeAddress, onSetLimit }: SafeGuardsTabProps) {
  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadLimits = async () => {
      setLoading(true);
      try {
        // In production, this would fetch from the smart contract
        // For now, return empty
        setLimits([]);
      } catch (e) {
        console.error('Failed to load limits:', e);
      } finally {
        setLoading(false);
      }
    };

    void loadLimits();
  }, [safeAddress]);

  const formatMove = (octas: number) => (octas / 100000000).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">SafeGuards</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Set spending limits for trusted operators
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
          Set Limit
        </Button>
      </div>

      {/* Info Card */}
      <Card variant="glass" padding="md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white mb-1">How SafeGuards Work</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Beneficiaries can withdraw up to their daily limit without needing multisig approval.
              Limits reset every 24 hours. This is useful for operational expenses or trusted team members.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && limits.length === 0 && (
        <Card variant="outline" className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">No Spending Limits</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Set up spending limits to allow trusted addresses to withdraw without multisig approval.
          </p>
          <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
            Set First Limit
          </Button>
        </Card>
      )}

      {/* Limits List */}
      {!loading && limits.length > 0 && (
        <div className="space-y-3">
          {limits.map((limit, index) => {
            const remaining = Math.max(0, limit.dailyLimit - limit.spent);
            const usedPercent = (limit.spent / limit.dailyLimit) * 100;

            return (
              <Card key={index}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-slate-900 dark:text-white truncate">
                        {limit.beneficiary.slice(0, 10)}...{limit.beneficiary.slice(-6)}
                      </code>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {formatMove(remaining)}/{formatMove(limit.dailyLimit)} MOVE
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Resets in {24 - Math.floor((Date.now() - limit.lastReset) / 3600000)}h
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${100 - usedPercent}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SetLimitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (beneficiary, limit) => {
          await onSetLimit(beneficiary, limit);
          setShowModal(false);
        }}
      />
    </div>
  );
}
