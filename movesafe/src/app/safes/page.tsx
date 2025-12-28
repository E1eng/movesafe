'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Search, Users, Clock, ArrowRight } from 'lucide-react';
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

      // Only fetch safes where the connected wallet public key is included in the owners array.
      // This prevents showing a "public" list in the UI.
      const { data: dbSafes, error } = await supabase
        .from('safes')
        .select('*')
        .contains('owners', [connectedPubKey])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const localSafesRaw = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
      const localSafes = Array.isArray(localSafesRaw)
        ? localSafesRaw.filter((s: any) => {
            const owners = Array.isArray(s?.owners) ? s.owners : [];
            return owners.map((o: any) => String(o).toLowerCase()).includes(connectedPubKey);
          })
        : [];

      const allSafes = [
        ...localSafes,
        ...(dbSafes || []).map((safe: any) => ({
          ...safe,
          createdAt: safe.created_at,
        }))
      ];

      const uniqueSafes = allSafes.filter((safe: any, index: number, self: any[]) =>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {!connected && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Connect your wallet</h2>
            <p className="text-slate-600 dark:text-slate-400">
              To keep safes private, we only show safes owned by your connected wallet.
            </p>
          </div>
        )}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Safes
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Browse and manage your multisig wallets
          </p>

          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mb-8 flex justify-between items-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {filteredSafes.length} safes found
          </div>
          <Link
            href="/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Shield className="w-4 h-4" />
            Create New Safe
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-600 dark:text-slate-400">Loading safes...</div>
          </div>
        ) : filteredSafes.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              No safes found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first safe to get started'}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Shield className="w-5 h-5" />
              Create Safe
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSafes.map((safe) => (
              <Link
                key={safe.address}
                href={`/safes/${safe.address}`}
                className="block bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">
                      {safe.name}
                    </h3>
                    <div className="text-sm font-mono text-slate-500 dark:text-slate-400">
                      {safe.address.slice(0, 10)}...{safe.address.slice(-8)}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {safe.threshold}/{safe.owners.length} signatures
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Created {new Date(safe.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
 }
