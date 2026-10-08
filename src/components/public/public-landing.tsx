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
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  LogOut,
  Coins,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  Scale,
  ReceiptText,
  KeyRound,
  Crown,
  Award,
  Clock,
  Check,
  Layers,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/shared';
import { useDemo } from '@/lib/demo-context';
import { useI18n } from '@/lib/i18n';
import { AuthModal } from '@/components/auth/auth-modal';
import { DemoTourModal } from '@/components/circle/modals';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';

export function PublicLandingPage() {
  const { dark, toggleTheme, user, role, signOut, authModalOpen, setAuthModalOpen } = useDemo();
  const { t } = useI18n();

  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'signin' | 'signup'>('signin');
  const [borrowAmount, setBorrowAmount] = useState(30000);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Unified 70/30 Single Monthly Payment Simulator States
  const [monthlyDeposit, setMonthlyDeposit] = useState(3000); // ₹3,000 / member / month
  const totalCircleMembers = 12;
  const totalMonthlyCollected = monthlyDeposit * totalCircleMembers; // ₹36,000/mo
  const emergencyMonthlyAddition = Math.round(totalMonthlyCollected * 0.70); // ₹25,200/mo (70%)
  const rotationMonthlyPot = Math.round(totalMonthlyCollected * 0.30); // ₹10,800/mo (30%)

  // Compassionate Debt Relief (Ibra'a / Sadaqah) Interactive State
  const [sponsoredCount, setSponsoredCount] = useState(0);
  const [rahimLoanRemaining, setRahimLoanRemaining] = useState(20000);
  const [lastSponsorTime, setLastSponsorTime] = useState<string | null>(null);

  const handleSponsorDemo = () => {
    if (rahimLoanRemaining <= 0) {
      toast.info("Rahim's loan is already 100% settled! Resetting for demonstration.");
      setRahimLoanRemaining(20000);
      setSponsoredCount(0);
      return;
    }
    const installment = 2000;
    setRahimLoanRemaining((prev) => Math.max(0, prev - installment));
    setSponsoredCount((c) => c + 1);
    setLastSponsorTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.success('MashaAllah! ₹2,000 sponsored for Brother Rahim as voluntary Sadaqah Ibra’a.', {
      description: 'Credited directly back into the 70% Emergency Pool (Quran 2:280).'
    });
  };

  // Ledger preview demo tab
  const [selectedLedgerFilter, setSelectedLedgerFilter] = useState<'all' | 'contribution' | 'disbursement' | 'repayment'>('all');

  const openAuth = (tab: 'signin' | 'signup') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  // Conventional vs Qard Hasan comparison
  const interestRate = 0.26; // 26% commercial microfinance
  const procFee = 600;
  const conventionalInterest = Math.round(borrowAmount * (interestRate / 2)); // 6-month term
  const conventionalTotal = borrowAmount + conventionalInterest + procFee;

  const mockRotationRounds = [
    { round: 1, month: 'Jan', recipient: 'Muhammed Shafi', payout: rotationMonthlyPot, status: 'Completed' },
    { round: 2, month: 'Feb', recipient: 'Fathima Nasrin', payout: rotationMonthlyPot, status: 'Completed' },
    { round: 3, month: 'Mar', recipient: 'Ibrahim Kutty', payout: rotationMonthlyPot, status: 'Completed' },
    { round: 4, month: 'Apr', recipient: 'Ayesha Hameed', payout: rotationMonthlyPot, status: 'Completed' },
    { round: 5, month: 'May (Active)', recipient: 'Rahim Mohammed', payout: rotationMonthlyPot, status: 'Active' },
    { round: 6, month: 'Jun', recipient: 'Yusuf Ali', payout: rotationMonthlyPot, status: 'Upcoming' },
    { round: 7, month: 'Jul', recipient: 'Bilal Ahmed', payout: rotationMonthlyPot, status: 'Upcoming' },
    { round: 8, month: 'Aug', recipient: 'Zainab Bibi', payout: rotationMonthlyPot, status: 'Upcoming' },
    { round: 9, month: 'Sep', recipient: 'Mustafa Kamal', payout: rotationMonthlyPot, status: 'Upcoming' },
    { round: 10, month: 'Oct', recipient: 'Mariam Begum', payout: rotationMonthlyPot, status: 'Upcoming' },
    { round: 11, month: 'Nov', recipient: 'Hassan Raza', payout: rotationMonthlyPot, status: 'Upcoming' },
    { round: 12, month: 'Dec', recipient: 'Khaled Omar', payout: rotationMonthlyPot, status: 'Upcoming' }
  ];

  const mockLedgerBlocks = [
    { id: 'LE-022', date: '2026-10-05', type: 'Repayment', desc: 'QH-002 · installment received', amount: 2000, balance: 150000, hash: '7c82a1bf' },
    { id: 'LE-021', date: '2026-09-28', type: 'Repayment', desc: 'QH-004 · installment received', amount: 2000, balance: 148000, hash: '9b14f820' },
    { id: 'LE-020', date: '2026-08-12', type: 'Disbursement', desc: 'QH-004 · principal disbursed', amount: -40000, balance: 146000, hash: '3e55c702' },
    { id: 'LE-019', date: '2026-07-18', type: 'Contribution', desc: 'Rahim Mohammed · pool contribution', amount: 15000, balance: 186000, hash: 'd48e11a9' }
  ];

  const filteredLedger = mockLedgerBlocks.filter((b) => {
    if (selectedLedgerFilter === 'all') return true;
    return b.type.toLowerCase() === selectedLedgerFilter;
  });

  const faqs = [
    {
      q: 'What is a Qard Hasan Circle?',
      a: 'Qard Hasan (literally "a beautiful loan") is a Shariah-compliant mutual financial structure where community members pool monthly funds to lend to one another in times of need with strictly 0% interest and 0 processing fees. Every rupee repaid returns to the pool to assist the next family.'
    },
    {
      q: 'How does the Unified 70/30 Single-Payment Model work?',
      a: 'Members make only ONE single monthly deposit (e.g. ₹3,000). The protocol automatically allocates 70% (₹2,100) to the Emergency Qard Pool for 0% crisis loans and 30% (₹900) to the Guaranteed Monthly Rotation Pot (₹10,800/mo). Every month, one member receives the full ₹10,800 pot in fair rotation with zero bidding stress or discount deductions.'
    },
    {
      q: 'How does guarantor vouching (Kafalah) replace credit scores?',
      a: 'Rather than requiring invasive credit score checks or selling household assets for collateral, a borrower is vouched for by an active circle member (Kafalah). This builds a network of mutual community brotherhood and honor.'
    },
    {
      q: 'How is financial transparency maintained?',
      a: 'Every contribution, loan disbursal, repayment, and chit draw is cryptographically logged in an append-only, SHA-256 hash-chained ledger. All circle members can audit and verify pool balances in real time.'
    },
    {
      q: 'What happens in severe hardship or default (Debt Relief / Ibra’a)?',
      a: 'In accordance with Quran 2:280, if a borrower suffers severe hardship, wealthier circle members can sponsor and pay off their monthly installments directly as voluntary Sadaqah Jariyah (Ibra’a), relieving the debtor while keeping the emergency pool 100% solvent.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary scroll-smooth">
      {/* Public Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md shadow-primary/10 ring-1 ring-border/60 transition-transform group-hover:scale-105">
              <img src={logoImg} alt="Qard Hasan Logo" className="size-full object-contain" />
            </span>
            <span className="font-display text-lg font-bold">
              Qard Hasan <span className="font-sans text-[10px] tracking-widest text-muted-foreground uppercase">Circles</span>
            </span>
          </a>

          {/* In-page navigation anchors (Showcase mode) */}
          <nav className="hidden items-center gap-5 text-xs font-semibold text-muted-foreground md:flex">
            <a href="#dual-pool" className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <Coins size={14} className="text-amber-500" />
              <span>Wealth & Chit (70/30)</span>
            </a>
            <a href="#anti-riba" className="hover:text-foreground transition-colors">
              0% Micro-Lending
            </a>
            <a href="#ledger-showcase" className="hover:text-foreground transition-colors">
              Tamper-Proof Ledger
            </a>
            <a href="#governance" className="hover:text-foreground transition-colors">
              Governance
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
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
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl text-xs font-bold border-primary/40 bg-card hover:bg-muted shadow-xs transition-all cursor-pointer"
                >
                  <Link to="/dashboard" title="Open Circle Dashboard">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{user.name.split(' ')[0]} ({role})</span>
                    <ArrowRight size={13} className="text-primary ml-0.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await signOut();
                    toast.info('Signed out');
                  }}
                  className="size-8 text-muted-foreground hover:text-rose-600 cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={15} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-1.5 text-xs font-medium"
                >
                  <Link to="/auth">
                    <LogIn size={14} />
                    <span>Sign In</span>
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                >
                  <Link to="/auth">
                    <UserPlus size={14} />
                    <span>Join Circle</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-40 size-[350px] rounded-full bg-gold/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles size={14} className="text-gold" />
            <span>Islamic Microfinance · Dual-Pool Savings · Cryptographic Ledger</span>
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Reviving <span className="text-primary italic font-serif">Zero-Interest</span> Mutual Care & Wealth Building
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pool monthly savings with your neighbours, disburse emergency loans at <strong className="text-foreground">0.0% interest</strong>, participate in a transparent <strong className="text-amber-600 dark:text-amber-400">70/30 Rotating Chit Fund</strong>, and audit every transaction via a tamper-proof ledger.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Button
                size="lg"
                asChild
                className="gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 cursor-pointer"
              >
                <Link to="/dashboard">
                  <span>Go to Circle Dashboard</span>
                  <ArrowRight size={16} />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => openAuth('signup')}
                className="gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90"
              >
                <UserPlus size={16} />
                Join Mahallu Circle
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoTourOpen(true)}
              className="gap-2 rounded-2xl border-gold/40 bg-gold-soft/40 px-6 font-medium text-gold-foreground hover:bg-gold-soft"
            >
              <Sparkles size={16} className="text-gold" />
              5-Minute Interactive Tour
            </Button>
          </div>

          {/* Quranic Inscription */}
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
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dual-Pool Split</p>
              <p className="mt-1 font-display text-2xl font-bold text-amber-500 sm:text-3xl">70% / 30%</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Emergency + Chit Wealth</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ledger Audit Chain</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">SHA-256</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">100% Tamper-evident</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE 1: UNIFIED 70/30 DUAL-POOL & COMPASSIONATE DEBT RELIEF (IBRA'A) */}
      {/* ========================================================================= */}
      <section id="dual-pool" className="py-16 sm:py-24 bg-gradient-to-b from-background via-amber-500/5 to-background border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Coins size={14} />
              <span>Unified Single-Payment Model · Shariah Compliant</span>
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-4xl text-foreground">
              Pay Once a Month: 70% Emergency + 30% Pure Rotation
            </h2>
            <p className="mt-3 text-xs text-muted-foreground sm:text-sm leading-relaxed">
              No multiple fees, no complex bidding stress. Members contribute <strong className="text-foreground">once a month</strong> (e.g. ₹3,000). Exactly <strong className="text-emerald-600 dark:text-emerald-400">70%</strong> powers the emergency 0% loan pool, while <strong className="text-amber-600 dark:text-amber-400">30%</strong> provides a guaranteed monthly lump-sum payout to every member in fair turn.
            </p>
          </div>

          {/* Interactive Single-Payment 70/30 Split Controller */}
          <div className="mt-12 rounded-3xl border border-amber-500/30 bg-card p-6 sm:p-8 shadow-xl shadow-amber-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Single Monthly Payment Simulator (12 Circle Members)</span>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Member Deposit: ₹{monthlyDeposit.toLocaleString('en-IN')} / month
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  70% Emergency (₹{emergencyMonthlyAddition.toLocaleString('en-IN')}/mo)
                </span>
                <span className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  30% Rotation (₹{rotationMonthlyPot.toLocaleString('en-IN')}/mo)
                </span>
              </div>
            </div>

            {/* Slider with - / + Stepper Buttons */}
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-foreground">Adjust Monthly Contribution / Member:</span>
                <span className="text-primary font-display font-bold text-sm">
                  Total Monthly Circle Collection: ₹{totalMonthlyCollected.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setMonthlyDeposit((m) => Math.max(1000, m - 500))}
                  disabled={monthlyDeposit <= 1000}
                  className="size-9 shrink-0 rounded-xl border-border bg-background hover:bg-muted"
                  title="Decrease monthly contribution by ₹500"
                >
                  <Minus size={14} />
                </Button>

                <div className="relative flex-1">
                  <input
                    type="range"
                    min={1000}
                    max={10000}
                    step={500}
                    value={monthlyDeposit}
                    onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                    style={{
                      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((monthlyDeposit - 1000) / 9000) * 100}%, var(--muted) ${((monthlyDeposit - 1000) / 9000) * 100}%, var(--muted) 100%)`
                    }}
                    className="h-3 w-full cursor-pointer appearance-none rounded-full accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setMonthlyDeposit((m) => Math.min(10000, m + 500))}
                  disabled={monthlyDeposit >= 10000}
                  className="size-9 shrink-0 rounded-xl border-border bg-background hover:bg-muted"
                  title="Increase monthly contribution by ₹500"
                >
                  <Plus size={14} />
                </Button>
              </div>

              {/* Quick Tap Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Monthly Presets:</span>
                {[
                  { label: '₹1,500/mo (Basic)', val: 1500 },
                  { label: '₹3,000/mo (Recommended Standard)', val: 3000 },
                  { label: '₹5,000/mo (Accelerated)', val: 5000 },
                  { label: '₹10,000/mo (High Growth)', val: 10000 }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setMonthlyDeposit(p.val)}
                    className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition-all ${
                      monthlyDeposit === p.val
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary'
                        : 'border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Visual Cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    70% Emergency Qard Pool (+₹{emergencyMonthlyAddition.toLocaleString('en-IN')}/mo)
                  </span>
                  <span className="font-display text-lg font-bold text-foreground">70% Share</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Every month, <strong>₹{emergencyMonthlyAddition.toLocaleString('en-IN')}</strong> feeds the 0% emergency lending pool for medical surgeries, school fees, and debt relief. Accumulates to <strong>₹{(emergencyMonthlyAddition * 6).toLocaleString('en-IN')}</strong> in 6 months.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Coins size={16} />
                    30% Guaranteed Rotation Pot (₹{rotationMonthlyPot.toLocaleString('en-IN')}/mo)
                  </span>
                  <span className="font-display text-lg font-bold text-foreground">30% Share</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Every single month, exactly <strong>one member</strong> receives <strong>₹{rotationMonthlyPot.toLocaleString('en-IN')}</strong> in guaranteed fair rotation. Over 12 months, all 12 members receive ₹{rotationMonthlyPot.toLocaleString('en-IN')} with zero bidding loss.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Dual Showcase: Pure Rotation Schedule + Compassionate Debt Relief */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* 12-Month Pure Rotation Schedule (7 Cols) */}
            <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Zero-Bidding Rotation
                    </span>
                    <h3 className="font-display text-base font-bold text-foreground mt-1">
                      12-Month Guaranteed Payout Schedule
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground">Payout / Member</span>
                    <p className="font-display text-base font-bold text-primary">₹{rotationMonthlyPot.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  Every member takes the full pot once in 12 months without stressful discount auctions:
                </p>

                <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {mockRotationRounds.map((r) => (
                    <div
                      key={r.round}
                      className={`flex items-center justify-between rounded-xl p-2.5 text-xs ${
                        r.status === 'Active'
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'bg-background/60 border border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-xs text-primary">#{r.round}</span>
                        <div>
                          <p className="font-semibold text-foreground text-xs leading-none">{r.recipient}</p>
                          <span className="text-[10px] text-muted-foreground">{r.month} Payout</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground font-display text-xs">
                          ₹{r.payout.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">100% Guaranteed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Compassionate Debt Relief & Sponsorship Simulator (5 Cols) */}
            <div className="lg:col-span-6 rounded-3xl border border-primary/30 bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Quran 2:280 Principle
                    </span>
                    <h3 className="font-display text-base font-bold text-foreground mt-1">
                      Compassionate Debt Relief (Ibra'a / Sadaqah)
                    </h3>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <HeartHandshake size={20} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  When a borrower faces hard times, wealthier circle members can step in to <strong>sponsor and settle their installment</strong> as voluntary Sadaqah Jariyah:
                </p>

                {/* Live Loan Demo Card */}
                <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Emergency Loan · QH-002</span>
                      <h4 className="font-bold text-sm text-foreground">Rahim Mohammed (Mother's Surgery)</h4>
                    </div>
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      0% Qard Hasan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl border bg-background p-2">
                      <span className="text-[10px] text-muted-foreground">Original Borrowed</span>
                      <p className="font-bold text-foreground font-display text-sm mt-0.5">₹20,000</p>
                    </div>
                    <div className="rounded-xl border bg-background p-2">
                      <span className="text-[10px] text-muted-foreground">Remaining Debt</span>
                      <p className="font-bold text-rose-600 dark:text-rose-400 font-display text-sm mt-0.5">
                        ₹{rahimLoanRemaining.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Live Sponsorship Action */}
                  <div className="pt-1">
                    <Button
                      type="button"
                      onClick={handleSponsorDemo}
                      className="w-full gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                    >
                      <HeartHandshake size={15} />
                      <span>
                        {rahimLoanRemaining > 0
                          ? 'Sponsor ₹2,000 Installment for Brother Rahim'
                          : 'Loan 100% Settled! (Click to Reset)'}
                      </span>
                    </Button>
                  </div>

                  {sponsoredCount > 0 && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium animate-in fade-in-0 duration-300">
                      <p className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{sponsoredCount} Installment{sponsoredCount > 1 ? 's' : ''} Sponsored (₹{(sponsoredCount * 2000).toLocaleString('en-IN')})</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Credited back to the 70% Emergency Pool. Rahim's burden relieved with community honor!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE 2: ZERO-INTEREST MICRO-LENDING & ANTI-RIBA ENGINE */}
      {/* ========================================================================= */}
      <section id="anti-riba" className="py-16 sm:py-24 border-b border-border/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Ethical Comparison
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">
              0% Qard Hasan vs. Conventional Microfinance
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              See how commercial 24%–36% interest extracts wealth from families versus how Qard Hasan preserves community honor.
            </p>
          </div>

          {/* Amount Slider with Presets and Steppers */}
          <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Simulate Emergency Loan Need:</span>
              <span className="text-lg font-bold text-primary font-display">₹{borrowAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setBorrowAmount((b) => Math.max(5000, b - 5000))}
                disabled={borrowAmount <= 5000}
                className="size-8 shrink-0 rounded-lg border-border bg-background hover:bg-muted"
                title="Decrease loan amount by ₹5,000"
              >
                <Minus size={13} />
              </Button>

              <div className="relative flex-1">
                <input
                  type="range"
                  min={5000}
                  max={50000}
                  step={1000}
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((borrowAmount - 5000) / 45000) * 100}%, var(--muted) ${((borrowAmount - 5000) / 45000) * 100}%, var(--muted) 100%)`
                  }}
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-full accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setBorrowAmount((b) => Math.min(50000, b + 5000))}
                disabled={borrowAmount >= 50000}
                className="size-8 shrink-0 rounded-lg border-border bg-background hover:bg-muted"
                title="Increase loan amount by ₹5,000"
              >
                <Plus size={13} />
              </Button>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {[5000, 10000, 20000, 30000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBorrowAmount(amt)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    borrowAmount === amt
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold'
                      : 'border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-side Cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Commercial Microfinance */}
            <div className="relative rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400">
                  Commercial Microfinance / Informal Lender
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
                Extractive profits drained from struggling households; late payments compound penalties and trigger harassment.
              </p>
            </div>

            {/* Qard Hasan */}
            <div className="relative rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  Mahallu Qard Hasan Circle
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
                  <span>Processing & Platform Fees:</span>
                  <span className="font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3 text-sm font-bold text-primary">
                  <span>Total Repayable:</span>
                  <span>₹{borrowAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-emerald-200/90 leading-relaxed">
                100% of repaid funds recycle directly back into the pool to aid the next family. Zero exploitation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE 3: TAMPER-EVIDENT SHA-256 HASH-CHAINED PUBLIC LEDGER */}
      {/* ========================================================================= */}
      <section id="ledger-showcase" className="py-16 sm:py-24 bg-muted/20 border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary">
              <Layers size={14} />
              <span>Immutable Ledger · Zero Fraud Guarantee</span>
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-4xl">
              Cryptographic SHA-256 Audit Trail
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm leading-relaxed">
              Every single contribution, loan disbursal, and repayment generates a linked SHA-256 hash block. If any record is altered, the entire mathematical hash chain breaks instantly.
            </p>
          </div>

          {/* Ledger Filter Tabs & Interactive Table */}
          <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-foreground">Verified Chain State: 22 Blocks</span>
              </div>
              <div className="flex rounded-xl bg-muted p-1 text-xs">
                {(['all', 'contribution', 'disbursement', 'repayment'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedLedgerFilter(filter)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                      selectedLedgerFilter === filter ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] font-semibold text-muted-foreground">
                    <th className="py-3 px-2">Block ID</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-2 text-right">Pool Balance</th>
                    <th className="py-3 px-2 text-right">Block Hash (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                  {filteredLedger.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-2 font-bold text-primary">{b.id}</td>
                      <td className="py-3 px-2 text-muted-foreground">{b.date}</td>
                      <td className="py-3 px-2 font-sans">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          b.type === 'Contribution'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : b.type === 'Disbursement'
                            ? 'bg-rose-500/15 text-rose-500'
                            : 'bg-primary/15 text-primary'
                        }`}>
                          {b.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-sans font-medium text-foreground">{b.desc}</td>
                      <td className={`py-3 px-2 text-right font-bold ${b.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {b.amount > 0 ? `+₹${b.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(b.amount).toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-foreground">
                        ₹{b.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground font-mono">
                        0x{b.hash}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE 4: MULTI-ROLE COMMUNITY GOVERNANCE */}
      {/* ========================================================================= */}
      <section id="governance" className="py-16 sm:py-24 border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Decentralized Trust
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-4xl">
              Mahallu Community Governance Roles
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Clear segregation of duties ensures accountability, Shariah compliance, and brotherly support.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Crown size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Committee Admin</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Elected mosque committee members who approve emergency disbursements, conduct monthly chit draws, and manage pool ratios.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Users size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Circle Member</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Community participants who contribute monthly commitments, request emergency Qard loans, and collect auction dividends.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HeartHandshake size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Guarantor (Kafalah)</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Respected community members who vouch for borrowers, providing ethical social collateral without taking financial custody.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:border-primary/50 transition-all">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
                <BookOpen size={24} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Independent Auditor</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Auditors with read-only access who independently verify ledger hashes, bank receipts, and pool balances for full transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24">
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
                  className="flex w-full items-center justify-between text-left text-xs font-semibold text-foreground sm:text-sm cursor-pointer"
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
      <section className="border-t border-border/80 bg-primary/10 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to bring interest-free community finance to your Mahallu?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground sm:text-sm">
            Join Mahallu Qard Hasan Circle, sign in with your verified account, or test via our live interactive tour.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <Link to="/auth">
                <UserPlus size={16} />
                Join Circle or Sign In
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoTourOpen(true)}
              className="gap-2 rounded-2xl border-border px-6 font-medium"
            >
              <Sparkles size={16} className="text-gold" />
              Launch Interactive Tour
            </Button>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-border/80 bg-card py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow-xs ring-1 ring-border/50">
              <img src={logoImg} alt="Qard Hasan Logo" className="size-full object-contain" />
            </span>
            <span className="font-display font-semibold text-foreground">Qard Hasan Circles</span>
            <span className="text-muted-foreground">· Perinthalmanna Juma Masjid</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#dual-pool" className="hover:text-foreground">Wealth & Chit</a>
            <a href="#anti-riba" className="hover:text-foreground">0% Lending</a>
            <a href="#ledger-showcase" className="hover:text-foreground">Ledger</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
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

