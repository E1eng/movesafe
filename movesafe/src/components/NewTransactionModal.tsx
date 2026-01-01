'use client';

import { useState } from 'react';
import { Send, AlertCircle, Wallet, Coins, Loader2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { validateAddress, validateAmount } from '@/lib/validateAddress';
import { useTransaction } from '@/hooks/useTransaction';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeAddress: string;
  safeThreshold: number;
  safeOwners: string[];
  onTransactionCreated: () => void;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  safeAddress,
  safeThreshold,
  safeOwners,
  onTransactionCreated,
}: NewTransactionModalProps) {
  const { account } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // Validation states
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const { createTransaction, loading, error, setError } = useTransaction({
    safeAddress,
    creatorAddress: account?.address?.toString() || '',
    onSuccess: () => {
      setRecipient('');
      setAmount('');
      onTransactionCreated();
      onClose();
    }
  });

  const validateRecipient = (value: string) => {
    setRecipient(value);
    if (value) {
      const result = validateAddress(value);
      setRecipientError(result.isValid ? null : result.error || 'Invalid address');
    } else {
      setRecipientError(null);
    }
  };

  const validateAmountField = (value: string) => {
    setAmount(value);
    if (value) {
      const result = validateAmount(value);
      setAmountError(result.isValid ? null : result.error || 'Invalid amount');
    } else {
      setAmountError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientValid = validateAddress(recipient);
    const amountValid = validateAmount(amount);

    if (!recipientValid.isValid) {
      setRecipientError(recipientValid.error || 'Invalid address');
      return;
    }
    if (!amountValid.isValid) {
      setAmountError(amountValid.error || 'Invalid amount');
      return;
    }

    await createTransaction({ recipient, amount });
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setError(null);
    setRecipientError(null);
    setAmountError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Transaction"
      description="Create a new transaction proposal for this safe"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Recipient Address"
          value={recipient}
          onChange={(e) => validateRecipient(e.target.value)}
          placeholder="0x..."
          icon={<Wallet className="w-4 h-4" />}
          error={recipientError || undefined}
          hint="The address that will receive the funds"
        />

        <Input
          label="Amount (MOVE)"
          type="number"
          value={amount}
          onChange={(e) => validateAmountField(e.target.value)}
          placeholder="0.0"
          step="0.0001"
          min="0"
          icon={<Coins className="w-4 h-4" />}
          error={amountError || undefined}
          iconRight={<Badge variant="primary" size="sm">MOVE</Badge>}
        />

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
            disabled={!!recipientError || !!amountError || !recipient || !amount}
            icon={<Send className="w-4 h-4" />}
          >
            Create Proposal
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
