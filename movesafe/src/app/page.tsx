import Link from 'next/link';
import { Shield, Plus, Wallet, ArrowRight, Lock, Users, Zap, CheckCircle, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Live Badge */}
          <Badge variant="primary" size="lg" dot pulse className="mb-8">
            Powered by Movement Network
          </Badge>

          {/* Logo */}
          <div className="relative mb-10 group">
            <div className="absolute inset-0 bg-blue-600/20 rounded-3xl blur-2xl group-hover:bg-blue-600/30 transition-all duration-500" />
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 transform group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-white dark:border-slate-950 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-slate-900 dark:text-white">Secure Assets with</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 animate-gradient">
              Multi-Signature
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
            The most trusted multisig wallet for Movement Network.
            Enterprise-grade security with native MultiEd25519 accounts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/create">
              <Button size="lg" icon={<Plus className="w-5 h-5" />}>
                Create New Safe
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/safes">
              <Button variant="secondary" size="lg" icon={<Wallet className="w-5 h-5" />}>
                View My Safes
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-2xl mb-20">
            {[
              { value: '100%', label: 'On-chain' },
              { value: 'Native', label: 'MultiEd25519' },
              { value: 'K-of-N', label: 'Threshold' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-12">
          <Badge variant="default" size="md" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Built for Teams & DAOs
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to manage shared assets securely
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Lock,
              color: 'blue',
              title: 'Native Multisig',
              description: 'Uses Movement\'s native MultiEd25519 accounts. No smart contract risks.',
            },
            {
              icon: Users,
              color: 'green',
              title: 'Team Treasury',
              description: 'Perfect for DAOs. Set flexible K-of-N signature requirements.',
            },
            {
              icon: Zap,
              color: 'purple',
              title: 'Instant Execution',
              description: 'Collect signatures off-chain, submit when ready. Gas efficient.',
            },
            {
              icon: Globe,
              color: 'cyan',
              title: 'Easy Onboarding',
              description: 'Invite team members with a simple link. No wallet setup needed.',
            },
            {
              icon: Shield,
              color: 'amber',
              title: 'Spending Limits',
              description: 'Set daily limits for trusted operators. SafeGuards protect your funds.',
            },
            {
              icon: Sparkles,
              color: 'pink',
              title: 'Transaction Queue',
              description: 'Review, sign, and verify transactions before execution.',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            const colorClasses: Record<string, string> = {
              blue: 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-600 dark:text-blue-400',
              green: 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-600 dark:text-green-400',
              purple: 'from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-600 dark:text-purple-400',
              cyan: 'from-cyan-100 to-cyan-200 dark:from-cyan-900/50 dark:to-cyan-800/50 text-cyan-600 dark:text-cyan-400',
              amber: 'from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-600 dark:text-amber-400',
              pink: 'from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 text-pink-600 dark:text-pink-400',
            };

            return (
              <Card key={i} hover className="group">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[feature.color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <Card variant="glass" padding="lg" className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Create your first safe in under a minute. Invite your team and start managing assets securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create">
              <Button size="lg" icon={<Plus className="w-5 h-5" />}>
                Create Your First Safe
              </Button>
            </Link>
            <Link href="/drafts">
              <Button variant="ghost" size="lg">
                Join Existing Safe
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">MoveSafe</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2024 MoveSafe. Secured by Movement Network.
          </p>
        </div>
      </footer>
    </div>
  );
}
