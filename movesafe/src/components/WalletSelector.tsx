'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { X } from 'lucide-react';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSelector({ isOpen, onClose }: WalletSelectorProps) {
  const { wallets, connect } = useWallet();

  if (!isOpen) return null;

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {wallets && wallets.length > 0 ? (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  className="w-full flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {wallet.icon && (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-10 h-10 rounded-lg"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">
                      {wallet.name}
                    </div>
                    {wallet.url && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {wallet.readyState === 'Installed' ? 'Installed' : 'Not Installed'}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No wallets detected. Please install a wallet extension.
              </p>
              <div className="space-y-2 text-sm">
                <a
                  href="https://petra.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → Install Petra Wallet
                </a>
                <a
                  href="https://nightly.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → Install Nightly Wallet
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
