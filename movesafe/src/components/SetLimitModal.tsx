'use client';

import { useState } from 'react';
import { Shield, AlertCircle, Wallet, Coins } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { validateAddress, validateAmount } from '@/lib/validateAddress';

interface SetLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (beneficiary: string, dailyLimit: string) => Promise<void>;
}

export function SetLimitModal({ isOpen, onClose, onSubmit }: SetLimitModalProps) {
  const [beneficiary, setBeneficiary] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beneficiaryError, setBeneficiaryError] = useState<string | null>(null);

  const validateBeneficiary = (value: string) => {
    setBeneficiary(value);
    if (value) {
      const result = validateAddress(value);
      setBeneficiaryError(result.isValid ? null : result.error || 'Invalid address');
    } else {
      setBeneficiaryError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const beneficiaryValid = validateAddress(beneficiary);
    if (!beneficiaryValid.isValid) {
      setBeneficiaryError(beneficiaryValid.error || 'Invalid address');
      return;
    }

    if (!dailyLimit || parseFloat(dailyLimit) <= 0) {
      setError('Please enter a valid daily limit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(beneficiary, dailyLimit);
      setBeneficiary('');
      setDailyLimit('');
      onClose();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || 'Failed to set limit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBeneficiary('');
    setDailyLimit('');
    setError(null);
    setBeneficiaryError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Spending Limit"
      description="Allow an address to spend up to a daily limit without multisig"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info Banner */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">SafeGuard Feature</p>
              <p className="text-blue-600 dark:text-blue-400">
                The beneficiary can withdraw up to the daily limit without needing multisig approval.
              </p>
            </div>
          </div>
        </div>

        {/* Beneficiary */}
        <Input
          label="Beneficiary Address"
          value={beneficiary}
          onChange={(e) => validateBeneficiary(e.target.value)}
          placeholder="0x..."
          icon={<Wallet className="w-4 h-4" />}
          error={beneficiaryError || undefined}
          hint="Address that can spend within the limit"
        />

        {/* Daily Limit */}
        <Input
          label="Daily Limit (MOVE)"
          type="number"
          value={dailyLimit}
          onChange={(e) => setDailyLimit(e.target.value)}
          placeholder="1.0"
          step="0.1"
          min="0"
          icon={<Coins className="w-4 h-4" />}
          iconRight={
            <Badge variant="primary" size="sm">MOVE</Badge>
          }
          hint="Maximum amount per 24 hours"
        />

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!!beneficiaryError || !beneficiary || !dailyLimit}
            icon={<Shield className="w-4 h-4" />}
          >
            Set Limit
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
