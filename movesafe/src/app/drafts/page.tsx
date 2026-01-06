'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { FileText, Users, ChevronRight, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { supabase, SafeDraft } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function DraftsPage() {
  const router = useRouter();
  const { connected, account } = useWallet();
  const [drafts, setDrafts] = useState<SafeDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const connectedPubKey = useMemo(() => {
    if (!account?.publicKey) return null;
    return account.publicKey.toString().toLowerCase();
  }, [account?.publicKey]);

  useEffect(() => {
    if (!connected) {
      router.push('/');
      return;
    }

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
  }, [connectedPubKey, connected, router]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="h-full flex flex-col p-8 bg-black text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <button
          onClick={() => router.push('/select')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Safes</span>
        </button>

        <h1 className="text-3xl font-bold mb-2">Pending Drafts</h1>
        <p className="text-zinc-400">Safes waiting for co-signers to join</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
            <FileText className="w-10 h-10 text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Pending Drafts</h3>
          <p className="text-zinc-400 max-w-xs mb-6">
            Create a new safe with &quot;Invite&quot; mode to generate a shareable invite link for co-signers to join.
          </p>
          <button
            onClick={() => router.push('/select')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Safe
          </button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto p-2"
        >
          {drafts.map((draft) => (
            <motion.button
              key={draft.id}
              variants={item}
              onClick={() => router.push(`/draft/${draft.id}`)}
              className="group relative p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col gap-4 cursor-pointer shadow-lg shadow-black/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-indigo-500/20 group-hover:border-blue-500/30 transition-all duration-300 shadow-lg shadow-black/20">
                    <FileText className="w-6 h-6 text-zinc-400 group-hover:text-blue-400 transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{draft.name || 'Unnamed Draft'}</h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      DRAFT
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users className="w-4 h-4" />
                <span>{draft.owners?.length || 0} of {draft.owner_limit} joined</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
