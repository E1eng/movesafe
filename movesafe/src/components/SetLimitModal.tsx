'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createTransactionPayload } from '@/lib/multisig';

interface SetLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeAddress: string;
  creatorAddress: string;
  contractAddress: string;
  onSuccess: () => void;
}

export function SetLimitModal({
  isOpen,
  onClose,
  safeAddress,
  creatorAddress,
  contractAddress,
  onSuccess,
}: SetLimitModalProps) {
  const [beneficiary, setBeneficiary] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!beneficiary.trim()) {
        throw new Error('Beneficiary address is required');
      }

      const limitInOctas = Math.floor(parseFloat(dailyLimit) * 100000000);
      if (isNaN(limitInOctas) || limitInOctas <= 0) {
        throw new Error('Invalid daily limit amount');
      }

      const payload = createTransactionPayload(
        `${contractAddress}::spending_limit::approve_limit`,
        [beneficiary.trim(), limitInOctas],
        []
      );

      const { data: accountData } = await supabase
        .from('transactions')
        .select('sequence_number')
        .eq('safe_address', safeAddress)
        .order('sequence_number', { ascending: false })
        .limit(1);

      const nextSequenceNumber = accountData && accountData.length > 0 
        ? accountData[0].sequence_number + 1 
        : 0;

      const { error: dbError } = await supabase
        .from('transactions')
        .insert({
          safe_address: safeAddress,
          payload,
          created_by: creatorAddress,
          sequence_number: nextSequenceNumber,
          status: 'PENDING',
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setBeneficiary('');
      setDailyLimit('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create spending limit proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Set Spending Limit
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This creates a multisig proposal. The beneficiary can instantly withdraw up to 
              their daily limit once approved by {safeAddress.slice(0, 6)}... owners.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Beneficiary Address
            </label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Daily Limit (MOVE)
            </label>
            <input
              type="number"
              step="0.00000001"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              placeholder="100.0"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Maximum amount the beneficiary can withdraw per day
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Creating Proposal...' : 'Create Proposal'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
