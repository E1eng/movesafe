'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FileText, Users, ChevronRight, Wallet, Plus } from 'lucide-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function DraftsPage() {
  const { connected, account } = useWallet();
  const [drafts, setDrafts] = useState<SafeDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

  useEffect(() => {
    const loadDrafts = async () => {
      if (!connectedPubKey) {
        setDrafts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('safe_drafts')
          .select('*')
          .eq('status', 'DRAFT');

        if (error) throw error;

        // Filter drafts where connected wallet is an owner
        const myDrafts = (data as SafeDraft[]).filter((d) =>
          d.owners?.some((o) => String(o).toLowerCase() === connectedPubKey)
        );

        setDrafts(myDrafts);
      } catch (e) {
        console.error('Failed to load drafts:', e);
      } finally {
        setLoading(false);
      }
    };

    void loadDrafts();
  }, [connectedPubKey]);

  // Not connected
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
            Connect your wallet to view your draft safes.
          </p>
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
            Drafts
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Invitation-based safes waiting to be finalized
          </p>
        </div>
        <Link href="/create">
          <Button icon={<Plus className="w-5 h-5" />}>
            Create New Draft
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && drafts.length === 0 && (
        <Card variant="outline" className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No Drafts Found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Create a new safe with &quot;Invite to Join&quot; mode to create a shareable draft.
          </p>
          <Link href="/create">
            <Button icon={<Plus className="w-5 h-5" />}>
              Create Draft Safe
            </Button>
          </Link>
        </Card>
      )}

      {/* Drafts Grid */}
      {!loading && drafts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((draft) => (
            <Link key={draft.id} href={`/draft/${draft.id}`}>
              <Card hover className="group h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {draft.name || 'Unnamed Draft'}
                      </h3>
                      <Badge variant="warning" size="sm" className="mt-1">
                        Draft
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="default" size="sm">
                    <Users className="w-3 h-3" />
                    {draft.owners?.length || 0}/{draft.owner_limit} joined
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {draft.threshold} signatures
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${((draft.owners?.length || 0) / draft.owner_limit) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
