'use client';

import { useState } from 'react';
import { Send, AlertCircle, Wallet, Coins, Loader2 } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
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

        <div className="space-y-2">
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
            iconRight={
              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">MOVE</span>
            }
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !!recipientError || !!amountError || !recipient || !amount}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-4 h-4" />
            Create Proposal
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
