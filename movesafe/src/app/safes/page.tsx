'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Shield, Plus, Search, Wallet, Users, Clock, ChevronRight } from 'lucide-react';
import { supabase, Safe } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function SafesPage() {
  const { connected, account } = useWallet();
  const [safes, setSafes] = useState<Safe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

  useEffect(() => {
    const loadSafes = async () => {
      setLoading(true);
      try {
        // Load from Supabase
        const { data, error } = await supabase.from('safes').select('*');
        if (error) throw error;

        // Filter to only show safes owned by connected wallet
        const ownedSafes = (data as Safe[]).filter((safe) => {
          if (!connectedPubKey || !safe.owners) return false;
          return safe.owners.some(
            (owner) => String(owner).toLowerCase() === connectedPubKey
          );
        });

        // Also load from localStorage
        try {
          const local = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
          const localFiltered = local.filter((s: Safe) => {
            if (!connectedPubKey || !s.owners) return false;
            return s.owners.some(
              (owner: string) => String(owner).toLowerCase() === connectedPubKey
            );
          });

          // Merge, avoiding duplicates
          const merged = [...ownedSafes];
          localFiltered.forEach((ls: Safe) => {
            if (!merged.find((s) => s.address === ls.address)) {
              merged.push(ls);
            }
          });
          setSafes(merged);
        } catch {
          setSafes(ownedSafes);
        }
      } catch (e) {
        console.error('Failed to load safes:', e);
      } finally {
        setLoading(false);
      }
    };

    if (connected && connectedPubKey) {
      void loadSafes();
    } else {
      setSafes([]);
      setLoading(false);
    }
  }, [connected, connectedPubKey]);

  const filteredSafes = safes.filter((safe) =>
    (safe.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (safe.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Not connected state
  if (!connected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connect your wallet to view and manage your safes.
          </p>
          <Badge variant="info" size="lg">
            Use the sidebar to connect
          </Badge>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            My Safes
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {safes.length} safe{safes.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/create">
          <Button icon={<Plus className="w-5 h-5" />}>
            Create New Safe
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSafes.length === 0 && (
        <Card variant="outline" className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
            <Shield className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Safes Found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            {searchTerm
              ? 'No safes match your search. Try a different term.'
              : 'Create your first safe to start managing assets securely.'}
          </p>
          {!searchTerm && (
            <Link href="/create">
              <Button icon={<Plus className="w-5 h-5" />}>
                Create Your First Safe
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Safes Grid */}
      {!loading && filteredSafes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSafes.map((safe) => (
            <Link key={safe.address} href={`/safes/${safe.address}`}>
              <Card hover className="group h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {safe.name || 'Unnamed Safe'}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {safe.address.slice(0, 8)}...{safe.address.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary" size="sm">
                    <Users className="w-3 h-3" />
                    {safe.threshold}/{safe.owners?.length || '?'}
                  </Badge>
                  {safe.created_at && (
                    <Badge variant="default" size="sm">
                      <Clock className="w-3 h-3" />
                      {new Date(safe.created_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
