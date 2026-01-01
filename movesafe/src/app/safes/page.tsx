'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Plus, Search, ChevronRight, Users, Shield } from 'lucide-react';
import { supabase, Safe } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
        const { data, error } = await supabase.from('safes').select('*');
        if (error) throw error;

        const ownedSafes = (data as Safe[]).filter((safe) => {
          if (!connectedPubKey || !safe.owners) return false;
          return safe.owners.some(
            (owner) => String(owner).toLowerCase() === connectedPubKey
          );
        });

        // Local Storage Fallback
        try {
          const local = JSON.parse(localStorage.getItem('movesafe_safes') || '[]');
          const localFiltered = local.filter((s: Safe) => {
            if (!connectedPubKey || !s.owners) return false;
            return s.owners.some(
              (owner: string) => String(owner).toLowerCase() === connectedPubKey
            );
          });

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
        console.error(e);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Safes</h1>
          <p className="text-slate-500">Manage your shared treasuries.</p>
        </div>
        <Link href="/create">
          <Button icon={<Plus className="w-4 h-4" />}>New Safe</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Input
          placeholder="Filter safes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="bg-white dark:bg-slate-900"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredSafes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Safes Found</h3>
          <p className="text-slate-500 mb-4">You don't have any safes yet.</p>
          {connected && (
            <Link href="/create">
              <Button variant="secondary">Create one now</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Safe Name</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Address</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Signers</th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {filteredSafes.map((safe) => (
                <tr key={safe.address} className="group hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Shield className="w-4 h-4" />
                      </div>
                      {safe.name || 'Untitled Safe'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {safe.address.slice(0, 8)}...{safe.address.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {safe.threshold} / {safe.owners?.length || '?'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/safes/${safe.address}`}>
                      <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
