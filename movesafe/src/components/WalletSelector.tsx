'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { Wallet, ExternalLink } from 'lucide-react';
import { useState } from 'react';

// Define a simplified Wallet type since it's not exported
// Define a simplified Wallet type since it's not exported
interface AptosWallet {
  name: string;
  count: number;
  icon: string;
  url: string;
  adapter: unknown; // Removed any
  readyState: string;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
  const { wallets, connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const { toast } = useToast();

  const handleConnect = async (wallet: AptosWallet) => {
    setIsConnecting(true);
    try {
      await connect(wallet.name);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${wallet.name}`,
        variant: "success",
        duration: 3000
      });
      onClose();
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || String(error);
      // Don't show error for user rejection
      if (errorMessage.toLowerCase().includes('rejected')) {
        toast({
          title: "Connection Cancelled",
          description: "You cancelled the request.",
          variant: "info",
          duration: 3000
        });
      } else {
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "error"
        });
        console.error('Failed to connect:', error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Filter to show installed wallets first
  const sortedWallets = [...(wallets || [])].sort((a: unknown, b: unknown) => {
    const wA = a as AptosWallet;
    const wB = b as AptosWallet;
    const aInstalled = 'readyState' in wA && wA.readyState === 'Installed';
    const bInstalled = 'readyState' in wB && wB.readyState === 'Installed';
    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    return 0;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Wallet"
      description="Choose a wallet to connect to MoveSafe"
      size="sm"
    >
      <div className="space-y-2">
        {sortedWallets.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No wallets detected. Please install a wallet extension.
            </p>
            <a
              href="https://petra.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              Get Petra Wallet
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          sortedWallets.map((wallet: unknown) => {
            const w = wallet as AptosWallet;
            const isInstalled = 'readyState' in w && w.readyState === 'Installed';

            return (
              <button
                key={w.name}
                onClick={() => handleConnect(w)}
                disabled={isConnecting || !isInstalled}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all
                  ${isInstalled
                    ? 'border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {w.icon && (
                  <img
                    src={w.icon}
                    alt={w.name}
                    className="w-8 h-8 rounded-lg"
                  />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {w.name}
                  </div>
                  {!isInstalled && (
                    <div className="text-xs text-slate-500">Not installed</div>
                  )}
                </div>
                {isInstalled && (
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                    Detected
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {isConnecting && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Connecting...
          </div>
        </div>
      )}

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
