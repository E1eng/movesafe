'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Search, Users, Clock, ArrowRight, Plus, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface SafeRow {
  address: string;
  name: string;
  threshold: number;
  owners: string[];
  createdAt: string;
}

export default function SafesIndex() {
  const { connected, account } = useWallet();
  const [safes, setSafes] = useState<SafeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    void loadSafes();
  }, [connected, account?.publicKey]);

  const loadSafes = async () => {
    setLoading(true);
    try {
      if (!connected || !account?.publicKey) {
        setSafes([]);
        return;
      }

      const connectedPubKey = account.publicKey.toString().toLowerCase();

      const { data: dbSafes, error } = await supabase
        .from('safes')
        .select('*')
        .contains('owners', [connectedPubKey])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const localSafesRaw = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
      const localSafes = Array.isArray(localSafesRaw)
        ? localSafesRaw.filter((s: { owners?: string[] }) => {
          const owners = Array.isArray(s?.owners) ? s.owners : [];
          return owners.map((o: string) => String(o).toLowerCase()).includes(connectedPubKey);
        })
        : [];

      const allSafes = [
        ...localSafes,
        ...(dbSafes || []).map((safe: { created_at?: string }) => ({
          ...safe,
          createdAt: safe.created_at,
        }))
      ];

      const uniqueSafes = allSafes.filter((safe: SafeRow, index: number, self: SafeRow[]) =>
        index === self.findIndex((s) => s.address === safe.address)
      );

      setSafes(uniqueSafes);
    } catch (error) {
      console.error('Error loading safes:', error);
      setSafes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSafes = safes.filter((safe) =>
    (safe.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (safe.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              My Safes
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {connected ? 'Your multisig wallets' : 'Connect wallet to view your safes'}
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create Safe
          </Link>
        </div>

        {/* Not connected message */}
        {!connected && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Connect Your Wallet</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              We keep safes private. Only safes where you are an owner will be shown.
            </p>
          </div>
        )}

        {/* Search */}
        {connected && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {connected && loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse border border-slate-200 dark:border-slate-700">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {connected && !loading && filteredSafes.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Shield className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              {searchTerm ? 'No safes found' : 'No safes yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first multisig safe to get started'}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              Create Your First Safe
            </Link>
          </div>
        )}

        {/* Safe Grid */}
        {connected && !loading && filteredSafes.length > 0 && (
          <>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {filteredSafes.length} safe{filteredSafes.length !== 1 ? 's' : ''} found
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSafes.map((safe) => (
                <Link
                  key={safe.address}
                  href={`/safes/${safe.address}`}
                  className="group block bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                          {safe.name}
                        </h3>
                      </div>
                      <div className="text-sm font-mono text-slate-500 dark:text-slate-400 truncate">
                        {safe.address.slice(0, 10)}...{safe.address.slice(-6)}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>{safe.threshold}/{safe.owners.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(safe.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
