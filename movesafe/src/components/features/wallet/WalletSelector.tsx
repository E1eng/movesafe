'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Wallet, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AptosWallet {
  name: string;
  count: number;
  icon: string;
  url: string;
  adapter: unknown;
  readyState: string;
}

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
  const { wallets, connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);



  const handleConnect = async (wallet: AptosWallet) => {
    setIsConnecting(true);
    try {
      await connect(wallet.name);
      toast.success('Wallet Connected', {
        description: `Connected to ${wallet.name}`,
        duration: 3000
      });
      onClose();
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || String(error);
      if (errorMessage.toLowerCase().includes('rejected')) {
        toast.info('Connection Cancelled', {
          description: "You cancelled the request.",
          duration: 3000
        });
      } else {
        toast.error('Connection Failed', {
          description: errorMessage
        });
        console.error('Failed to connect:', error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredWallets = (wallets || []).filter(w =>
    !w.name.toLowerCase().includes('google') &&
    !w.name.toLowerCase().includes('apple')
  );

  const sortedWallets = [...filteredWallets].sort((a: unknown, b: unknown) => {
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 mb-4">
              No wallets detected. Please install a wallet extension.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://petra.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Get Petra Wallet
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://nightly.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Get Nightly Wallet
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
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
                    ? 'border-zinc-700 hover:border-blue-500 hover:bg-blue-500/10'
                    : 'border-zinc-800 opacity-50 cursor-not-allowed'
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
                  <div className="font-medium text-white">
                    {w.name}
                  </div>
                  {!isInstalled && (
                    <div className="text-xs text-zinc-500">Not installed</div>
                  )}
                </div>
                {isInstalled && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                    Detected
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {isConnecting && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </div>
        </div>
      )}


    </Modal>
  );
}
