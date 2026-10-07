import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Wallet,
  HandCoins,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Sun,
  Moon,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/shared';
import { useDemo } from '@/lib/demo-context';
import { useI18n } from '@/lib/i18n';
import { AuthModal } from '@/components/auth/auth-modal';
import { DemoTourModal } from '@/components/circle/modals';

export function PublicLandingPage() {
  const { circle, dark, toggleTheme, isFirebaseUser, user, authModalOpen, setAuthModalOpen } = useDemo();
  const { language, setLanguage, t } = useI18n();

  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'signin' | 'signup'>('signin');
  const [borrowAmount, setBorrowAmount] = useState(30000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openAuth = (tab: 'signin' | 'signup') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  // Comparison calculator numbers
  const interestRate = 0.26; // 26% conventional microfinance
  const procFee = 600;
  const conventionalInterest = Math.round(borrowAmount * (interestRate / 2)); // 6-month term
  const conventionalTotal = borrowAmount + conventionalInterest + procFee;

  const faqs = [
    {
      q: 'What is a Qard Hasan Circle?',
      a: 'Qard Hasan (literally "a beautiful loan") is a Shariah-compliant financial structure where community members pool monthly funds to lend to one another in times of need with strictly 0% interest and 0 processing fees. Every rupee repaid returns to the pool to assist the next family.'
    },
    {
      q: 'How does it protect members from predatory debt?',
      a: 'Conventional microfinance and informal lenders often charge 24%–36% APR plus hidden processing and late fees. In a Qard Hasan Circle, the total repayable is always 100% equal to the principal borrowed. There are no penalty fees, compounding interest, or lender profits.'
    },
    {
      q: 'How does guarantor vouching work?',
      a: 'Rather than requiring invasive credit score checks or selling household assets for collateral, a borrower is vouched for by an active circle member (Kafalah). This relies on mutual community brotherhood and honor.'
    },
    {
      q: 'How is financial transparency maintained?',
      a: 'Every contribution, loan disbursal, and repayment is cryptographically logged in an append-only, SHA-256 hash-chained ledger. All circle members can audit and verify pool balances in real time.'
    },
    {
      q: 'What happens in severe hardship or default?',
      a: 'In accordance with Quran 2:280, if a borrower suffers severe hardship, the Mahallu committee can reschedule payments or, through community consensus, convert the outstanding principal into voluntary Sadaqah (charity).'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Public Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <HeartHandshake size={20} strokeWidth={1.8} />
            </span>
            <span className="font-display text-lg font-bold">
              Qard Hasan <span className="font-sans text-[10px] tracking-widest text-muted-foreground uppercase">Circles</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground md:block"
            >
              Dashboard
            </Link>
            <Link
              to="/ledger"
              className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground md:block"
            >
              Public Ledger
            </Link>
            <Link
              to="/rules"
              className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground md:block"
            >
              Principles
            </Link>

            <div className="h-4 w-px bg-border hidden md:block" />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-8 text-muted-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            {/* Auth Buttons */}
            {isFirebaseUser ? (
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl text-xs">
                <Link to="/dashboard">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {user?.name?.split(' ')[0] || 'My Circle'}
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('signin')}
                  className="gap-1.5 text-xs font-medium"
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => openAuth('signup')}
                  className="gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                >
                  <UserPlus size={14} />
                  <span>Join Circle</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Background ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-40 size-[350px] rounded-full bg-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles size={14} className="text-gold" />
            <span>Islamic Microfinance & Mahallu Mutual Care</span>
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Reviving <span className="text-primary italic font-serif">Zero-Interest</span> Community Care
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pool monthly savings with your neighbours, disburse emergency loans with <strong className="text-foreground">0.0% interest and 0 fees</strong>, protect families from debt traps, and audit every single transaction through a cryptographic tamper-evident ledger.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90"
            >
              <Link to="/dashboard">
                Enter Mahallu Portal
                <ArrowRight size={16} />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoTourOpen(true)}
              className="gap-2 rounded-2xl border-gold/40 bg-gold-soft/40 px-6 font-medium text-gold-foreground hover:bg-gold-soft"
            >
              <Sparkles size={16} className="text-gold" />
              5-Minute Interactive Demo
            </Button>
          </div>

          {/* Quranic Inscription Callout */}
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-primary/20 bg-card/60 p-4 backdrop-blur-sm">
            <p className="font-serif text-xs italic text-primary sm:text-sm">
              "Who is it that will lend to Allah a good loan (Qard Hasan) so that He will multiply it for them, and they will have a noble reward?"
            </p>
            <span className="mt-1 block text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
              — Surah Al-Hadid (57:11)
            </span>
          </div>
        </div>
      </section>

      {/* Live Key Metrics Bar */}
      <section className="border-y border-border/80 bg-muted/20 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Mahallu Pool</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl">₹1,50,000</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Available for immediate aid</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Interest Rate (Riba)</p>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-400 sm:text-3xl">0.00%</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Strictly principal-only</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Lender Fees</p>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-400 sm:text-3xl">₹0.00</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">No processing charges</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ledger Integrity</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">100%</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Cryptographically verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Anti-Riba Comparison Calculator */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Ethical Comparison
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">
              Qard Hasan vs. Conventional Microfinance
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              See how conventional interest traps families versus how Qard Hasan preserves dignity and recirculates wealth.
            </p>
          </div>

          {/* Amount Slider */}
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Emergency Need:</span>
              <span className="text-base font-bold text-primary font-display">₹{borrowAmount.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={50000}
              step={1000}
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(Number(e.target.value))}
              className="mt-3 w-full cursor-pointer accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>₹5,000</span>
              <span>₹25,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Side-by-side Cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Conventional */}
            <div className="relative rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400">
                  Commercial Microfinance / Bank
                </span>
                <XCircle size={18} className="text-rose-400" />
              </div>

              <div className="mt-6 space-y-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Principal Borrowed:</span>
                  <span className="font-semibold text-foreground">₹{borrowAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Interest (26% APR):</span>
                  <span className="font-semibold">+ ₹{conventionalInterest.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Processing & Legal Fees:</span>
                  <span className="font-semibold">+ ₹{procFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3 text-sm font-bold text-rose-400">
                  <span>Total Repayable:</span>
                  <span>₹{conventionalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                Profits extracted from vulnerable families; late payments trigger compounding penalties and social harassment.
              </p>
            </div>

            {/* Qard Hasan */}
            <div className="relative rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  Qard Hasan Community Circle
                </span>
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>

              <div className="mt-6 space-y-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Principal Borrowed:</span>
                  <span className="font-semibold text-foreground">₹{borrowAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Interest / Riba (0.0%):</span>
                  <span className="font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Processing Fees:</span>
                  <span className="font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3 text-sm font-bold text-primary">
                  <span>Total Repayable:</span>
                  <span>₹{borrowAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-emerald-200/90 leading-relaxed">
                100% of repaid funds recycle directly back to the pool to assist the next neighbour in need. Zero exploitation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Pillars */}
      <section className="border-t border-border/80 bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Core Principles
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">
              How Qard Hasan Circles Operate
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Rooted in Islamic brotherhood, ethical finance, and decentralized community verification.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Wallet size={20} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">1. Mutual Pooling</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Members contribute monthly commitments or voluntary continuous charity (Sadaqah Jariyah) into the Mahallu reserve.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <HandCoins size={20} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">2. Dignified Borrowing</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Members facing urgent medical, education, or emergency needs request interest-free capital without humiliating collateral.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Users size={20} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">3. Guarantor Vouching</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Community members vouch (Kafalah) for borrowers, building a trust network that replaces extractive credit scores.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen size={20} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">4. Tamper-Evident Ledger</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Every transaction generates an immutable SHA-256 hash block. Full transparency ensures zero fraud or misuse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Everything You Need to Know
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-border/80 bg-card p-4 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between text-left text-xs font-semibold text-foreground sm:text-sm"
                >
                  <span>{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp size={16} className="text-primary" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </button>
                {openFaq === index && (
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border-t border-border/80 bg-primary/10 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to experience interest-free community finance?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground sm:text-sm">
            Join Mahallu Qard Hasan Circle or sign in with your account to participate.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => openAuth('signup')}
              className="gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <UserPlus size={16} />
              Join Mahallu Circle
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 rounded-2xl border-border px-6"
            >
              <Link to="/dashboard">Explore Live Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-border/80 bg-card py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartHandshake size={14} />
            </span>
            <span className="font-display font-semibold text-foreground">Qard Hasan Circles</span>
            <span className="text-muted-foreground">· Perinthalmanna Juma Masjid</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/rules" className="hover:text-foreground">Principles</Link>
            <Link to="/ledger" className="hover:text-foreground">Ledger</Link>
            <Link to="/settings" className="hover:text-foreground">Settings</Link>
          </div>
          <p className="text-[10px]">
            Built with Barakah · 100% Shariah-compliant mutual aid.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />

      {/* Demo Tour Modal */}
      <DemoTourModal isOpen={demoTourOpen} onClose={() => setDemoTourOpen(false)} />
    </div>
  );
}
