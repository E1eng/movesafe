import Link from 'next/link';
import { Shield, Plus, Wallet, ArrowRight, Lock, Users, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Powered by Movement Network
          </div>

          {/* Logo */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Shield className="w-14 h-14 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-white dark:border-slate-900" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-slate-50 leading-tight">
            Secure Your Assets with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500"> Multi-Signature</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
            MoveSafe is the most trusted multisig wallet for Movement Network.
            Manage digital assets with native MultiEd25519 accounts and enterprise-grade security.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="/create"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Create New Safe
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/safes"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet className="w-5 h-5" />
              View My Safes
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-20 w-full max-w-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">100%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">On-chain Security</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">Native</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">MultiEd25519</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">K-of-N</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Flexible Threshold</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
              Native Multisig
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Uses Movement's native MultiEd25519 accounts for maximum security. No smart contract risks.
            </p>
          </div>

          <div className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
              Team Treasury
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Perfect for DAOs and teams. Set flexible K-of-N signature requirements for any transaction.
            </p>
          </div>

          <div className="group p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-50">
              Instant Execution
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Collect signatures off-chain, submit when threshold is met. Fast and gas-efficient.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© 2024 MoveSafe. Secured by Movement Network.</p>
        </div>
      </footer>
    </div>
  );
}
