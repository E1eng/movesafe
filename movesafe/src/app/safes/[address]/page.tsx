'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { supabase, Safe, Transaction, Signature } from '@/lib/supabase';
import { TransactionQueueItem } from '@/components/TransactionQueueItem';
import { NewTransactionModal } from '@/components/NewTransactionModal';
import { SetLimitModal } from '@/components/SetLimitModal';
import { SafeGuardsTab } from '@/components/SafeGuardsTab';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Ed25519PublicKey } from '@aptos-labs/ts-sdk';
import { assembleMultiSigAuthenticator } from '@/lib/multisig';
import { aptos } from '@/lib/movement';

export default function SafeDashboard() {
  const params = useParams();
  const router = useRouter();
  const { account, signTransaction } = useWallet();
  const safeAddress = params.address as string;

  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

  const [safe, setSafe] = useState<Safe | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [signatures, setSignatures] = useState<Record<string, Signature[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'safeguards'>('queue');
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showSetLimitModal, setShowSetLimitModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contractAddress, setContractAddress] = useState('0x1');

  const isConnectedOwner = (() => {
    if (!safe || !account) return false;
    try {
      const acct = account.address.toString().toLowerCase();
      const ownerAddresses = safe.owners.map((pk) => {
        const clean = pk.startsWith('0x') ? pk.slice(2) : pk;
        return new Ed25519PublicKey(clean).authKey().derivedAddress().toString().toLowerCase();
      });
      return ownerAddresses.includes(acct);
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (DEBUG) console.log('🔍 SafeDashboard useEffect triggered, address:', safeAddress);
    if (safeAddress) {
      loadSafeData();
    } else {
      console.error('⚠️ No safeAddress provided!');
    }
  }, [safeAddress]);

  const loadSafeData = async () => {
    if (DEBUG) console.log('📡 loadSafeData called for address:', safeAddress);
    setLoading(true);
    setError(null);
    
    try {
      if (DEBUG) console.log('🔎 Querying Supabase for safe:', safeAddress);
      const { data: safeData, error: safeError } = await supabase
        .from('safes')
        .select('*')
        .eq('address', safeAddress)
        .single();

      if (DEBUG) console.log('📦 Supabase response:', { data: safeData, error: safeError });

      if (safeError) {
        console.error('❌ Error loading safe:', safeError);
        setError(`Failed to load safe: ${safeError.message}`);
        setSafe(null);
        setLoading(false);
        return;
      }

      if (!safeData) {
        console.warn('⚠️ No safe data returned');
        setError('Safe not found in database');
        setSafe(null);
        setLoading(false);
        return;
      }

      if (DEBUG) console.log('✅ Safe loaded successfully:', safeData);

      setSafe(safeData);

      try {
        const balanceData = await aptos.getAccountCoinAmount({
          accountAddress: safeAddress,
          coinType: '0x1::aptos_coin::AptosCoin',
        });
        setBalance((balanceData / 100000000).toFixed(8));
      } catch (err) {
        setBalance('0');
      }

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('safe_address', safeAddress)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

      const txIds = (txData || []).map((tx) => tx.id);
      if (txIds.length > 0) {
        const { data: sigData, error: sigError } = await supabase
          .from('signatures')
          .select('*')
          .in('transaction_id', txIds);

        if (sigError) throw sigError;

        const sigsByTx = (sigData || []).reduce((acc, sig) => {
          if (!acc[sig.transaction_id]) {
            acc[sig.transaction_id] = [];
          }
          acc[sig.transaction_id].push(sig);
          return acc;
        }, {} as Record<string, Signature[]>);

        setSignatures(sigsByTx);
      }
    } catch (err) {
      console.error('Error loading safe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(safeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignTransaction = async (txId: string) => {
    if (!account || !signTransaction) {
      alert('⚠️ Please connect your wallet to sign transactions');
      return;
    }

    if (!safe) {
      alert('⚠️ Safe data is not loaded yet. Please refresh and try again.');
      return;
    }

    if (!isConnectedOwner) {
      alert('❌ This wallet is not an owner of this Safe. Please connect an owner wallet to sign.');
      return;
    }

    // Confirmation prompt
    const confirmed = window.confirm(
      '🔐 Sign Transaction\n\n' +
      'You are about to sign this transaction with your wallet.\n\n' +
      'This will NOT execute the transaction yet - it only records your approval.\n\n' +
      'Do you want to continue?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const transaction = transactions.find((tx) => tx.id === txId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (!transaction.payload?.function) {
        throw new Error('Invalid transaction payload');
      }

      // Build transaction for signing
      const txOptions = (transaction.payload as any).txOptions as
        | { maxGasAmount?: string; gasUnitPrice?: string; expireTimestamp?: string }
        | undefined;
      const maxGasAmount = txOptions?.maxGasAmount ? Number(txOptions.maxGasAmount) : undefined;
      const gasUnitPrice = txOptions?.gasUnitPrice ? Number(txOptions.gasUnitPrice) : undefined;
      const expireTimestamp = txOptions?.expireTimestamp ? Number(txOptions.expireTimestamp) : undefined;
      const rawTxn = await aptos.transaction.build.simple({
        sender: safeAddress,
        data: {
          function: transaction.payload.function as `${string}::${string}::${string}`,
          typeArguments: transaction.payload.typeArguments || [],
          functionArguments: transaction.payload.functionArguments || [],
        },
        options: {
          accountSequenceNumber: transaction.sequence_number,
          maxGasAmount,
          gasUnitPrice,
          expireTimestamp,
        },
      });

      // Request wallet signature - this MUST trigger a wallet prompt in production
      const signed = await signTransaction({ transactionOrPayload: rawTxn });

      // Wallet-adapter returns an AccountAuthenticator; extract Ed25519 signature bytes
      const { authenticator } = signed;
      if (!authenticator.isEd25519()) {
        throw new Error('Unsupported authenticator returned by wallet. Expected Ed25519.');
      }

      const signatureHex = authenticator.signature.toString();

      // Save signature to database
      const { error: dbError } = await supabase.from('signatures').insert({
        transaction_id: txId,
        signer_address: account.address.toString(),
        signature_hex: signatureHex,
      });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      alert('✅ Transaction signed successfully!\n\nYour signature has been recorded.');
      await loadSafeData();
    } catch (err: any) {
      console.error('Sign transaction error:', err);
      if (err.message?.includes('User rejected')) {
        alert('❌ Signature Cancelled\n\nYou rejected the signature request in your wallet.');
      } else {
        alert(`❌ Signing Failed\n\n${err.message}`);
      }
    }
  };

  const handleExecuteTransaction = async (txId: string) => {
    if (!safe) return;

    const confirmed = window.confirm(
      '⚡ Execute Transaction\n\n' +
      'This will submit the transaction to the blockchain.\n\n' +
      'Make sure you have enough signatures before executing.\n\n' +
      'Do you want to proceed?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const transaction = transactions.find((tx) => tx.id === txId);
      if (!transaction) throw new Error('Transaction not found');

      const txSignatures = signatures[txId] || [];
      if (txSignatures.length < safe.threshold) {
        throw new Error('Not enough signatures');
      }

      const rawTxn = await aptos.transaction.build.simple({
        sender: safeAddress,
        data: {
          function: transaction.payload.function as `${string}::${string}::${string}`,
          typeArguments: transaction.payload.typeArguments,
          functionArguments: transaction.payload.functionArguments,
        },
        options: {
          accountSequenceNumber: transaction.sequence_number,
          maxGasAmount: (transaction.payload as any).txOptions?.maxGasAmount
            ? Number((transaction.payload as any).txOptions.maxGasAmount)
            : undefined,
          gasUnitPrice: (transaction.payload as any).txOptions?.gasUnitPrice
            ? Number((transaction.payload as any).txOptions.gasUnitPrice)
            : undefined,
          expireTimestamp: (transaction.payload as any).txOptions?.expireTimestamp
            ? Number((transaction.payload as any).txOptions.expireTimestamp)
            : undefined,
        },
      });

      const signatureData = txSignatures.map((sig) => ({
        signer: sig.signer_address,
        hex: sig.signature_hex,
      }));

      const senderAuthenticator = assembleMultiSigAuthenticator(
        signatureData,
        safe.owners,
        safe.threshold
      );

      const committedTxn = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      // Persist tx hash immediately so we can reconcile later even if confirmation is slow.
      await supabase
        .from('transactions')
        .update({
          tx_hash: committedTxn.hash,
        })
        .eq('id', txId);

      let executedTx: any = null;
      try {
        executedTx = await aptos.waitForTransaction({
          transactionHash: committedTxn.hash,
          options: {
            timeoutSecs: 90,
            waitForIndexer: false,
          },
        });
      } catch (e: any) {
        // If it times out pending, don't treat it as a hard failure.
        const msg = String(e?.message || '');
        if (msg.includes('timed out in pending state')) {
          await loadSafeData();
          alert(
            `Submitted to chain but still pending confirmation.\n\nTx hash: ${committedTxn.hash}\n\nRefresh in a bit to see final status.`
          );
          return;
        }
        throw e;
      }

      await supabase
        .from('transactions')
        .update({
          status: 'EXECUTED',
          tx_hash: executedTx?.hash || committedTxn.hash,
          executed_at: new Date().toISOString(),
        })
        .eq('id', txId);

      await loadSafeData();
      alert('Transaction executed successfully!');
    } catch (err: any) {
      console.error('Error executing transaction:', err);
      alert(`Failed to execute: ${err.message}`);
    }
  };

  const pendingTransactions = transactions.filter((tx) => tx.status === 'PENDING');
  const executedTransactions = transactions.filter((tx) => tx.status === 'EXECUTED');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading safe...</div>
      </div>
    );
  }

  if (!safe) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Safe Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Address: <span className="font-mono text-sm">{safeAddress?.slice(0, 20)}...</span>
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This safe might not exist in the database yet. Check your Supabase connection or try creating it again.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/safes" className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg font-medium">
              Back to Safes
            </Link>
            <Link href="/create" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Create New Safe
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          type="button"
          onClick={() => {
            // Prefer actual browser back (so it returns to /safes list when you came from there)
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/safes');
            }
          }}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                {safe.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                  {safeAddress}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Balance</div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {balance}
                </span>
                <span className="text-slate-500 dark:text-slate-400">MOVE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Threshold</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {safe.threshold}-of-{safe.owners.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pending</div>
              <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {pendingTransactions.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Executed</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {executedTransactions.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'queue'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Queue ({pendingTransactions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                History ({executedTransactions.length})
              </button>
              <button
                onClick={() => setActiveTab('safeguards')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'safeguards'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                SafeGuards
              </button>
            </div>

            {account && (
              <button
                onClick={() => setShowNewTxModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Transaction
              </button>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'queue' && (
              <>
                {pendingTransactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No pending transactions
                  </div>
                ) : (
                  pendingTransactions.map((tx) => (
                    <TransactionQueueItem
                      key={tx.id}
                      transaction={tx}
                      threshold={safe.threshold}
                      signatureCount={signatures[tx.id]?.length || 0}
                      signatures={signatures[tx.id] || []}
                      ownerPublicKeys={safe.owners}
                      onSign={handleSignTransaction}
                      onExecute={handleExecuteTransaction}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'history' && (
              <>
                {executedTransactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No transaction history
                  </div>
                ) : (
                  executedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-slate-900 dark:text-slate-100 mb-1">
                            Transfer to {tx.payload.functionArguments[0].slice(0, 10)}...
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Executed: {new Date(tx.executed_at!).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm">
                          <a
                            href={`https://explorer.movementnetwork.xyz/txn/${tx.tx_hash}?network=bardock%20testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View on Explorer →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'safeguards' && (
              <SafeGuardsTab
                safeAddress={safeAddress}
                contractAddress={contractAddress}
                onSetLimit={() => setShowSetLimitModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      <NewTransactionModal
        isOpen={showNewTxModal}
        onClose={() => setShowNewTxModal(false)}
        safeAddress={safeAddress}
        creatorAddress={account?.address?.toString() || ''}
        onSuccess={loadSafeData}
      />

      <SetLimitModal
        isOpen={showSetLimitModal}
        onClose={() => setShowSetLimitModal(false)}
        safeAddress={safeAddress}
        creatorAddress={account?.address?.toString() || ''}
        contractAddress={contractAddress}
        onSuccess={loadSafeData}
      />
    </div>
  );
}
