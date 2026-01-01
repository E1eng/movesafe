'use client';

import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Plus, Shield, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome to MoveSafe
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Secure, minimalist multisig wallet for Movement Network.
          </p>
        </div>
        {connected && (
          <Link href="/create">
            <Button icon={<Plus className="w-4 h-4" />}>
              Create Safe
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Actions / Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/create" className="group">
          <Card className="h-full p-6 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <Plus className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Safe</h3>
            <p className="mt-1 text-sm text-slate-500">Deploy a new multisig shared wallet.</p>
          </Card>
        </Link>

        <Link href="/safes" className="group">
          <Card className="h-full p-6 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <Shield className="w-5 h-5 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">My Safes</h3>
            <p className="mt-1 text-sm text-slate-500">Manage your existing safe accounts.</p>
          </Card>
        </Link>

        {/* Placeholder for future stats or documentation */}
        <Card className="h-full p-6 border-dashed">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documentation</h3>
              <p className="mt-1 text-sm text-slate-500">Learn how to use MoveSafe.</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white">
              Read Docs <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
