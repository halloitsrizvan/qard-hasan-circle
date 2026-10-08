import { useState, useMemo } from 'react';
import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  ShieldCheck,
  Wallet,
  Coins,
  HandCoins,
  HeartHandshake,
  Sparkles,
  CalendarCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Award,
  CircleDot,
  Check,
  Building,
  Mail,
  Phone,
  Tag,
  Receipt,
  FileCheck2,
  ChevronRight,
  RefreshCw,
  Gift,
  AlertCircle,
  Percent,
  Layers,
  HelpCircle,
  Copy,
  ExternalLink,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money, StatusChip, formatDate, PageIntro } from '@/components/shared';
import { circleQueries, loanService } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import { useI18n } from '@/lib/i18n';
import type { Loan, Contribution, LedgerEntry, ChitRound } from '@/lib/types';
import { ContributeModal, RequestLoanModal, LoanDetailModal } from './modals';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ProfileView() {
  const queryClient = useQueryClient();
  const { user, circle, role, isFirebaseUser, setAuthModalOpen } = useDemo();
  const { t } = useI18n();

  const { data: wealthOverview } = useSuspenseQuery(circleQueries.wealth);
  const { data: members = [] } = useSuspenseQuery(circleQueries.members);
  const { data: contributions = [] } = useSuspenseQuery(circleQueries.contributions);
  const { data: loans = [] } = useSuspenseQuery(circleQueries.loans);
  const { data: ledger = [] } = useQuery(circleQueries.ledger);

  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [requestLoanModalOpen, setRequestLoanModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'chit' | 'loans' | 'history'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentYear = 2026;
  const currentMonthIdx = 9; // October 2026 (0-indexed)

  const currentUserId = user?.id || '';
  const currentUserName = user?.name || 'Circle Member';
  const currentUserEmail = user?.email || '';

  // 1. Match current user's membership and wealth share
  const memberObj = useMemo(() => {
    return members.find(
      (m) =>
        m.user.id === currentUserId ||
        (currentUserEmail && m.user.email?.toLowerCase() === currentUserEmail.toLowerCase()) ||
        (m.user.name && currentUserName && m.user.name.toLowerCase() === currentUserName.toLowerCase())
    );
  }, [members, currentUserId, currentUserEmail, currentUserName]);

  const userShare = useMemo(() => {
    return wealthOverview.memberShares.find(
      (m) =>
        m.userId === currentUserId ||
        (currentUserEmail && m.userId.toLowerCase() === currentUserEmail.toLowerCase()) ||
        (m.userName && currentUserName && m.userName.toLowerCase() === currentUserName.toLowerCase())
    );
  }, [wealthOverview.memberShares, currentUserId, currentUserEmail, currentUserName]);

  // 2. User's contributions (Regular & Voluntary) from both contributions table & ledger
  const userLedgerEntries = useMemo(() => {
    return ledger.filter((e) => {
      if (e.type !== 'Contribution') return false;
      const desc = e.description.toLowerCase();
      const uName = (currentUserName || '').toLowerCase();
      const uId = (currentUserId || '').toLowerCase();
      const uEmail = (currentUserEmail || '').toLowerCase();
      return (
        (uName && desc.includes(uName)) ||
        (uEmail && desc.includes(uEmail)) ||
        (uId && desc.includes(uId))
      );
    });
  }, [ledger, currentUserName, currentUserId, currentUserEmail]);

  const userContributions = useMemo(() => {
    return contributions.filter((c) => {
      if (c.userId === currentUserId) return true;
      if (currentUserEmail && c.userId.toLowerCase() === currentUserEmail.toLowerCase()) return true;
      const matchMember = members.find((m) => m.user.id === c.userId);
      if (matchMember) {
        if (currentUserEmail && matchMember.user.email?.toLowerCase() === currentUserEmail.toLowerCase()) return true;
        if (currentUserName && matchMember.user.name?.toLowerCase() === currentUserName.toLowerCase()) return true;
      }
      return false;
    });
  }, [contributions, currentUserId, currentUserEmail, currentUserName, members]);

  const paidContributions = userContributions.filter((c) => c.status === 'Paid');
  const directRegularPaid = paidContributions.filter((c) => c.type !== 'Voluntary').reduce((s, c) => s + c.amount, 0);
  const directVoluntaryPaid = paidContributions.filter((c) => c.type === 'Voluntary').reduce((s, c) => s + c.amount, 0);
  const ledgerRegularPaid = userLedgerEntries.reduce((s, e) => s + e.amount, 0);

  // 3. Monthly Commitment Calculation
  const monthlyCommitment =
    user?.monthlyCommitment ??
    memberObj?.membership.monthlyCommitment ??
    circle?.minContribution ??
    1000;

  const joinedAtDate = user?.joinedAt || memberObj?.membership.joinedAt || '2026-01-01';
  const joinMonthIdx = useMemo(() => {
    try {
      const d = new Date(joinedAtDate);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        if (year < currentYear) return 0;
        if (year > currentYear) return 12;
        return d.getMonth();
      }
    } catch {}
    return 0;
  }, [joinedAtDate, currentYear]);

  // 4. User 2026 12-Month Payment Matrix
  const monthlyStates = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => {
      if (idx < joinMonthIdx) {
        return {
          monthIdx: idx,
          name,
          fullName: FULL_MONTH_NAMES[idx],
          status: 'not_started' as const,
          label: 'Before Join',
          amount: 0,
          paidDate: null,
          hash: null
        };
      }

      // Check contributions table
      const cont = paidContributions.find((c) => {
        if (c.type === 'Voluntary') return false;
        const d = new Date(c.date);
        return !isNaN(d.getTime()) && d.getMonth() === idx && d.getFullYear() === currentYear;
      });

      if (cont) {
        return {
          monthIdx: idx,
          name,
          fullName: FULL_MONTH_NAMES[idx],
          status: 'paid' as const,
          label: 'Paid',
          amount: cont.amount,
          paidDate: cont.date,
          hash: cont.id
        };
      }

      // Check ledger entries
      const led = ledger.find((e) => {
        if (e.type !== 'Contribution') return false;
        const d = new Date(e.date);
        if (isNaN(d.getTime()) || d.getMonth() !== idx || d.getFullYear() !== currentYear) return false;
        const desc = e.description.toLowerCase();
        return (
          (currentUserName && desc.includes(currentUserName.toLowerCase())) ||
          (currentUserId && desc.includes(currentUserId.toLowerCase())) ||
          (currentUserEmail && desc.includes(currentUserEmail.toLowerCase()))
        );
      });

      if (led) {
        return {
          monthIdx: idx,
          name,
          fullName: FULL_MONTH_NAMES[idx],
          status: 'paid' as const,
          label: 'Paid (Ledger)',
          amount: led.amount,
          paidDate: led.date,
          hash: led.hash
        };
      }

      return {
        monthIdx: idx,
        name,
        fullName: FULL_MONTH_NAMES[idx],
        status: 'pending' as const,
        label: 'Pending',
        amount: monthlyCommitment,
        paidDate: null,
        hash: null
      };
    });
  }, [joinMonthIdx, paidContributions, ledger, currentYear, currentUserName, currentUserId, currentUserEmail, monthlyCommitment]);

  const paidMonthsCount = monthlyStates.filter((m) => m.status === 'paid').length;
  const pendingMonthsCount = monthlyStates.filter((m) => m.status === 'pending').length;
  const totalDueInYear = (12 - joinMonthIdx) * monthlyCommitment;
  const totalPaidInYear = monthlyStates
    .filter((m) => m.status === 'paid')
    .reduce((s, m) => s + m.amount, 0);

  // Exact live totals
  const regularPaid = Math.max(directRegularPaid, totalPaidInYear, ledgerRegularPaid, userShare?.totalContributed ?? 0);
  const voluntaryPaid = directVoluntaryPaid;
  const effectiveTotalContributed = regularPaid + voluntaryPaid;

  // 5. User's exact Emergency Pool Stake (70%) & Chit Pot Stake (30%)
  const emergencyStake = Math.round(regularPaid * ((wealthOverview.emergencyRatio || 70) / 100)) + voluntaryPaid;
  const chitPotAccumulatedStake = regularPaid - Math.round(regularPaid * ((wealthOverview.emergencyRatio || 70) / 100));
  const emergencySharePercent = wealthOverview.emergencyPool > 0
    ? Number(((emergencyStake / wealthOverview.emergencyPool) * 100).toFixed(1))
    : (userShare?.emergencySharePercent ?? 16.7);

  // 6. Chit / Rotation Pot data for this user
  const winningRound = useMemo(() => {
    return wealthOverview.chitRounds.find(
      (r) =>
        (r.winnerId === currentUserId ||
          (r.winnerName && currentUserName && r.winnerName.toLowerCase() === currentUserName.toLowerCase()) ||
          (userShare?.wonRound && r.roundNumber === userShare.wonRound)) &&
        r.status === 'Completed'
    );
  }, [wealthOverview.chitRounds, currentUserId, currentUserName, userShare]);

  const hasWonChit = !!winningRound || !!userShare?.hasWonPot;
  const chitPayoutGot = winningRound ? (winningRound.payoutAmount ?? winningRound.potAmount ?? 0) : 0;
  const dividendsEarned = userShare?.dividendEarned ?? 0;
  const totalChitBenefits = chitPayoutGot + dividendsEarned;

  // Unified list of all user payments from contributions table and ledger
  const allDisplayPayments = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      amount: number;
      type: 'Regular' | 'Voluntary';
      hash: string;
    }> = [];

    paidContributions.forEach((c) => {
      list.push({
        id: c.id,
        title: c.type === 'Voluntary' ? 'Voluntary Sadaqah Jariyah' : 'Regular Pool Commitment',
        date: c.date,
        amount: c.amount,
        type: c.type,
        hash: c.id
      });
    });

    monthlyStates
      .filter((m) => m.status === 'paid')
      .forEach((m) => {
        const alreadyExists = list.some((item) => {
          const d = new Date(item.date);
          return !isNaN(d.getTime()) && d.getMonth() === m.monthIdx;
        });
        if (!alreadyExists) {
          list.push({
            id: m.hash || `PAY-${m.name}-2026`,
            title: `${m.fullName} 2026 Commitment`,
            date: m.paidDate || `2026-${String(m.monthIdx + 1).padStart(2, '0')}-15`,
            amount: m.amount,
            type: 'Regular',
            hash: m.hash || `0x${m.name.toLowerCase()}2026`
          });
        }
      });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paidContributions, monthlyStates]);

  // 7. Loans data for current user
  const userLoans = useMemo(() => {
    return loans.filter((l) => {
      if (l.userId === currentUserId) return true;
      if (currentUserEmail && l.userId.toLowerCase() === currentUserEmail.toLowerCase()) return true;
      const mem = members.find((m) => m.user.id === l.userId);
      if (mem && currentUserName && mem.user.name?.toLowerCase() === currentUserName.toLowerCase()) return true;
      return false;
    });
  }, [loans, currentUserId, currentUserEmail, currentUserName, members]);

  const activeLoans = userLoans.filter((l) => ['Active', 'Requested', 'Guarantor pending', 'Due', 'Overdue'].includes(l.status));
  const repaidLoans = userLoans.filter((l) => l.status === 'Closed');
  const outstandingLoanAmount = activeLoans.reduce((s, l) => s + Math.max(l.amount - l.repaid, 0), 0);
  const totalLifetimeBorrowed = userLoans.reduce((s, l) => s + l.amount, 0);

  // 8. Guaranteed loans
  const guaranteedLoans = useMemo(() => {
    return loans.filter((l) => {
      return (
        (l.guarantorId === currentUserId ||
          (currentUserEmail && l.guarantorId.toLowerCase() === currentUserEmail.toLowerCase())) &&
        l.userId !== currentUserId
      );
    });
  }, [loans, currentUserId, currentUserEmail]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="page-enter space-y-7 pb-16">
      {/* Top Breadcrumb & Title */}
      <PageIntro
        title="My Member Profile"
        description="Your verified identity, emergency Qard pool equity, rotating chit savings benefits, and complete contribution record in the Mahallu circle."
      />

      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card/95 to-primary/5 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-20 size-72 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary to-primary/80 font-display text-2xl sm:text-3xl font-bold text-primary-foreground shadow-xl shadow-primary/20 ring-4 ring-background">
                {user?.initials || 'ME'}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background"
                title="Verified Circle Member"
              >
                <Check size={13} strokeWidth={3} />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {currentUserName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                  <ShieldCheck size={13} />
                  {role}
                </span>
                {hasWonChit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 animate-pulse">
                    <Award size={13} className="text-amber-500" />
                    Chit Winner (Round #{winningRound?.roundNumber || userShare?.wonRound})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Building size={14} className="text-primary/70" />
                  <span>{circle?.name || 'Perinthalmanna Mahallu Circle'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-primary/70" />
                  <span>{currentUserEmail || 'member@mahallu.org'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary/70" />
                  <span>Joined {formatDate(joinedAtDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <span className="font-mono text-[11px] bg-secondary/80 px-2 py-0.5 rounded-md text-foreground">
                  ID: {currentUserId || 'u-perin-1'}
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Verified Shariah Member · Good Standing
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <Button
              onClick={() => setContributeModalOpen(true)}
              className="gap-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              <Wallet size={15} />
              <span>Contribute / Pay Month</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setRequestLoanModalOpen(true)}
              className="gap-2 rounded-xl text-xs font-bold hover:bg-secondary transition-colors"
            >
              <HandCoins size={15} className="text-primary" />
              <span>Request 0% Qard</span>
            </Button>
            {isFirebaseUser && (
              <Button
                variant="ghost"
                onClick={() => setAuthModalOpen(true)}
                className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
              >
                Account Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards (User's Emergency Stake & Chiti Got) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Emergency Fund Stake (70% Equity) */}
        <div className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-card to-card p-5 shadow-lg transition-all hover:border-emerald-500/50 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck size={16} />
              EMERGENCY FUND STAKE
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              {emergencySharePercent}% Share
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <Money amount={emergencyStake} className="font-display text-3xl font-extrabold text-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              70% pool allocation + voluntary Sadaqah. Backing emergency medical & hardship relief for Mahallu families.
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Self-Covered Loan Limit:</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              You can borrow up to <strong className="text-foreground">₹{emergencyStake.toLocaleString('en-IN')}</strong> instantly with zero external guarantor needed.
            </p>
          </div>
        </div>

        {/* 2. Rotating Chit Savings & Chiti Got (30% Pot) */}
        <div className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-card to-card p-5 shadow-lg transition-all hover:border-amber-500/50 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Coins size={16} />
              CHITI GOT / CHIT BENEFIT
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              hasWonChit
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {hasWonChit ? 'Pot Won 🎉' : 'In Rotation'}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <Money amount={totalChitBenefits} className="font-display text-3xl font-extrabold text-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {hasWonChit
                ? `Received ₹${chitPayoutGot.toLocaleString('en-IN')} payout + ₹${dividendsEarned.toLocaleString('en-IN')} auction dividends.`
                : `₹${chitPotAccumulatedStake.toLocaleString('en-IN')} pooled stake · ₹${dividendsEarned.toLocaleString('en-IN')} dividends earned so far.`}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <Award size={13} className="text-amber-600 dark:text-amber-400" />
              <span>Chit Rotation Status:</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {hasWonChit
                ? `Successfully won Round #${winningRound?.roundNumber || userShare?.wonRound} pot. Continuing monthly contributions to support remaining members.`
                : `Eligible for upcoming Round #${wealthOverview.activeRound} draw (Estimated Pot: ₹${(wealthOverview.potPerRound || 3600).toLocaleString('en-IN')}).`}
            </p>
          </div>
        </div>

        {/* 3. Total Lifetime Contributions */}
        <div className="group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-lg transition-all hover:border-primary/40 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Wallet size={16} className="text-primary" />
              TOTAL CONTRIBUTED
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              ₹{monthlyCommitment.toLocaleString('en-IN')}/mo
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <Money amount={effectiveTotalContributed} className="font-display text-3xl font-extrabold text-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {paidMonthsCount} months paid in 2026.
              {voluntaryPaid > 0 && ` Includes ₹${voluntaryPaid.toLocaleString('en-IN')} Sadaqah Jariyah.`}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] rounded-xl bg-muted/60 p-2.5 border">
            <div>
              <span className="text-muted-foreground">Regular Pool: </span>
              <strong className="text-foreground">₹{regularPaid.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Sadaqah: </span>
              <strong className="text-emerald-700 dark:text-emerald-400">₹{voluntaryPaid.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* 4. Active Qard Hasan Loans Balance */}
        <div className="group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-lg transition-all hover:border-primary/40 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <HandCoins size={16} className="text-primary" />
              OUTSTANDING QARD
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              outstandingLoanAmount > 0 ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            }`}>
              {outstandingLoanAmount > 0 ? 'Active Loan' : 'Debt Free'}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <Money amount={outstandingLoanAmount} className="font-display text-3xl font-extrabold text-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {outstandingLoanAmount > 0
                ? `${activeLoans.length} active 0% interest loan. Principal repayment without penalty.`
                : 'Zero outstanding debt. Clean record in Mahallu Qard Hasan ledger.'}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] rounded-xl bg-muted/60 p-2.5 border">
            <div>
              <span className="text-muted-foreground">Lifetime Borrowed: </span>
              <strong className="text-foreground">₹{totalLifetimeBorrowed.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Repaid: </span>
              <strong className="text-emerald-700 dark:text-emerald-400">
                {repaidLoans.length} loan{repaidLoans.length !== 1 ? 's' : ''}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Profile Details */}
      <div className="flex items-center gap-2 border-b overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers size={15} />
          <span>Overview & Dual Pool</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'monthly'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <CalendarCheck size={15} />
          <span>2026 Commitment Matrix</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
            activeTab === 'monthly' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-foreground'
          }`}>
            {paidMonthsCount}/12
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chit')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'chit'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Coins size={15} />
          <span>Chit Savings & Bhishi</span>
          {hasWonChit && (
            <span className="size-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'loans'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <HandCoins size={15} />
          <span>My Loans & Guarantees</span>
          {userLoans.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === 'loans' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-foreground'
            }`}>
              {userLoans.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Receipt size={15} />
          <span>Payment History</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DUAL POOL SPLIT */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Dual Pool Split Graphic */}
          <div className="rounded-3xl border bg-card p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Your Dual-Pool Contribution Allocation
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How every ₹{monthlyCommitment.toLocaleString('en-IN')} monthly contribution is divided transparently
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                70% Emergency / 30% Chit Pot
              </span>
            </div>

            {/* Split Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${wealthOverview.emergencyRatio || 70}%` }}
                  title="70% Emergency Qard Pool"
                />
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${wealthOverview.wealthRatio || 30}%` }}
                  title="30% Rotating Chit Fund Pot"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 font-medium">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <span className="size-3 rounded-full bg-emerald-500" />
                  <span>
                    70% Emergency Qard Pool (₹{Math.round(monthlyCommitment * 0.7).toLocaleString('en-IN')}/mo)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <span className="size-3 rounded-full bg-amber-500" />
                  <span>
                    30% Rotating Chit Pot (₹{Math.round(monthlyCommitment * 0.3).toLocaleString('en-IN')}/mo)
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Explanations */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  <ShieldCheck size={17} className="text-emerald-600 dark:text-emerald-400" />
                  <h4>Your Emergency Stake (₹{emergencyStake.toLocaleString('en-IN')})</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Remains safe in the Mahallu treasury to provide 0% interest loans for emergency hospitalizations, education, and debt relief.
                  You can borrow up to this amount anytime with instant self-covered approval.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                  <Coins size={17} className="text-amber-600 dark:text-amber-400" />
                  <h4>Your Chit Pot Stake (₹{chitPotAccumulatedStake.toLocaleString('en-IN')})</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pooled into the monthly rotating chit draw. Every member receives a lump sum pot of ₹{(wealthOverview.potPerRound || 3600).toLocaleString('en-IN')} once during the 12-month cycle plus equal share of auction discount dividends.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Summary Matrix Box */}
          <div className="rounded-3xl border bg-card p-6 sm:p-7 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  2026 Commitment Snapshot
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your month-by-month status in the current cycle
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('monthly')}
                className="gap-1.5 text-xs font-bold rounded-xl"
              >
                <span>View Full Tracker</span>
                <ChevronRight size={14} />
              </Button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyStates.map((m) => (
                <div
                  key={m.name}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                    m.status === 'paid'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                      : m.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                      : 'bg-muted/40 border-dashed border-border text-muted-foreground/60'
                  }`}
                >
                  <span className="text-[11px] font-bold">{m.name}</span>
                  <div className="my-1.5">
                    {m.status === 'paid' ? (
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    ) : m.status === 'pending' ? (
                      <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                    ) : (
                      <span className="text-[9px] font-semibold text-muted-foreground">N/A</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold font-mono">
                    {m.status === 'paid' ? `₹${m.amount}` : m.status === 'pending' ? 'Due' : '—'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <strong>{paidMonthsCount}</strong> Months Paid (₹{totalPaidInYear.toLocaleString('en-IN')})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <strong>{pendingMonthsCount}</strong> Months Pending
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setContributeModalOpen(true)}
                className="gap-1.5 text-xs font-bold rounded-xl"
              >
                <Wallet size={13} />
                <span>Pay Next Pending Month</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 2026 MONTHLY COMMITMENT MATRIX */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                    Personal Payment Ledger
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold mt-1">
                  2026 Monthly Commitment Matrix
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enrolled at <strong className="text-foreground">₹{monthlyCommitment.toLocaleString('en-IN')} / month</strong>.
                  All payments are verified on the non-custodial community ledger.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    2026 Collection Rate
                  </p>
                  <p className="font-display text-xl font-bold text-foreground">
                    {Math.round((paidMonthsCount / Math.max(12 - joinMonthIdx, 1)) * 100)}%
                  </p>
                </div>
                <Button
                  onClick={() => setContributeModalOpen(true)}
                  className="gap-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20"
                >
                  <Wallet size={15} />
                  <span>Contribute Now</span>
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span>Completed: {paidMonthsCount} of {12 - joinMonthIdx} Enrolled Months</span>
                <span className="font-mono text-foreground font-bold">
                  ₹{totalPaidInYear.toLocaleString('en-IN')} / ₹{totalDueInYear.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.round((paidMonthsCount / Math.max(12 - joinMonthIdx, 1)) * 100),
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            {/* Month by Month List Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              {monthlyStates.map((m) => (
                <div
                  key={m.fullName}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    m.status === 'paid'
                      ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50'
                      : m.status === 'pending'
                      ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-muted/30 border-dashed border-border opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-foreground">
                          {m.fullName}
                        </span>
                        {m.monthIdx === currentMonthIdx && (
                          <span className="rounded-md bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {m.status === 'paid' ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            Paid on {m.paidDate ? formatDate(m.paidDate) : 'verified date'}
                          </span>
                        ) : m.status === 'pending' ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">
                            Due ₹{m.amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span>Enrolled from {MONTH_NAMES[joinMonthIdx]} 2026</span>
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        m.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : m.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {m.status === 'paid' ? (
                        <>
                          <Check size={11} strokeWidth={3} />
                          <span>Paid</span>
                        </>
                      ) : m.status === 'pending' ? (
                        <>
                          <Clock size={11} />
                          <span>Pending</span>
                        </>
                      ) : (
                        <span>Prior</span>
                      )}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Amount</span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        ₹{m.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {m.status === 'pending' ? (
                      <Button
                        size="sm"
                        onClick={() => setContributeModalOpen(true)}
                        className="h-8 gap-1 rounded-xl text-[11px] font-bold"
                      >
                        <Wallet size={12} />
                        <span>Pay Now</span>
                      </Button>
                    ) : m.status === 'paid' ? (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <Receipt size={12} className="text-primary" />
                        <span>{m.hash ? m.hash.slice(0, 10) : 'Verified'}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Not applicable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHIT SAVINGS & BHISHI DETAILS */}
      {activeTab === 'chit' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-amber-500" />
                  <span className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                    Non-Profit Rotating Savings (Bhishi)
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold mt-1">
                  12-Month Chit Savings Status
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Round #{wealthOverview.activeRound} of {wealthOverview.totalRounds || 12} · 100% principal rotation without auction losses.
                </p>
              </div>

              {hasWonChit ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-right">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    Chit Pot Won
                  </p>
                  <p className="font-display text-xl font-extrabold text-foreground">
                    ₹{chitPayoutGot.toLocaleString('en-IN')}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border bg-secondary/60 p-3.5 text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Next Estimated Pot
                  </p>
                  <p className="font-display text-xl font-bold text-foreground">
                    ₹{(wealthOverview.potPerRound || 3600).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* Winner Celebration Banner if won */}
            {hasWonChit && (
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <Award size={20} className="text-amber-500" />
                  <h3 className="font-display text-lg">
                    Congratulations! You Won Chit Round #{winningRound?.roundNumber || userShare?.wonRound}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You received a lump sum payout of <strong className="text-foreground">₹{chitPayoutGot.toLocaleString('en-IN')}</strong>.
                  Your continued monthly contributions of ₹{monthlyCommitment.toLocaleString('en-IN')} now empower the remaining Mahallu members to receive their rotation pot in upcoming months.
                </p>
              </div>
            )}

            {/* Chit Financial Summary Box */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-card p-4 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Chit Pot Accumulated Stake
                </span>
                <p className="font-display text-2xl font-bold text-foreground">
                  ₹{chitPotAccumulatedStake.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  30% of your regular pool payments pooled for rotating pots
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Auction Dividends Earned
                </span>
                <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{dividendsEarned.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Equal share of auction discount bids distributed to all members
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Chit Benefit Received
                </span>
                <p className="font-display text-2xl font-bold text-amber-700 dark:text-amber-300">
                  ₹{totalChitBenefits.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Sum of winning pot payout + all accumulated auction dividends
                </p>
              </div>
            </div>

            {/* List of All Chit Rounds */}
            <div className="space-y-3 pt-2">
              <h3 className="font-display text-base font-bold">12-Month Round Schedule</h3>
              <div className="divide-y rounded-2xl border overflow-hidden">
                {wealthOverview.chitRounds.map((r) => {
                  const isUserWinner =
                    r.winnerId === currentUserId ||
                    (r.winnerName && currentUserName && r.winnerName.toLowerCase() === currentUserName.toLowerCase());

                  return (
                    <div
                      key={r.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 transition-colors ${
                        isUserWinner
                          ? 'bg-amber-500/10 border-l-4 border-l-amber-500'
                          : r.status === 'Active'
                          ? 'bg-primary/5'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-secondary font-display text-xs font-bold">
                          #{r.roundNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{r.month} 2026</span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                r.status === 'Completed'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : r.status === 'Active'
                                  ? 'bg-primary/20 text-primary animate-pulse'
                                  : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              {r.status}
                            </span>
                            {isUserWinner && (
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                <Award size={11} />
                                <span>You Won This Round</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {r.status === 'Completed'
                              ? `Winner: ${r.winnerName || 'Member'} · Payout: ₹${(r.payoutAmount || r.potAmount).toLocaleString('en-IN')}`
                              : `Estimated Pot: ₹${r.potAmount.toLocaleString('en-IN')} · Mode: ${r.mode}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Your Dividend</span>
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            +₹{r.dividendPerMember || 0}
                          </span>
                        </div>
                        <div className="border-l pl-3">
                          <span className="text-[10px] text-muted-foreground block">Pot Size</span>
                          <span className="font-mono text-xs font-bold text-foreground">
                            ₹{r.potAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MY LOANS & GUARANTEES */}
      {activeTab === 'loans' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <HandCoins size={16} className="text-primary" />
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                    Shariah-Compliant 0% Financing
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold mt-1">
                  My Qard Hasan Borrowings
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Zero interest, zero processing fees, zero penalty charges. Covered by community trust and self-equity stake.
                </p>
              </div>

              <Button
                onClick={() => setRequestLoanModalOpen(true)}
                className="gap-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20"
              >
                <HandCoins size={15} />
                <span>Apply for Emergency Qard</span>
              </Button>
            </div>

            {/* Self-Covered Lending Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Self-Covered Lending Privilege (₹{emergencyStake.toLocaleString('en-IN')})</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your emergency fund stake allows you to request up to ₹{emergencyStake.toLocaleString('en-IN')} with instant fast-track approval without requiring another member to vouch.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRequestLoanModalOpen(true)}
                className="shrink-0 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/10 rounded-xl"
              >
                Request Self-Covered Qard
              </Button>
            </div>

            {/* User's Loans List */}
            <div className="space-y-3 pt-2">
              <h3 className="font-display text-base font-bold">Personal Loans History</h3>
              {userLoans.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground space-y-2">
                  <HandCoins size={32} className="mx-auto text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-foreground">No active or past loans</p>
                  <p className="text-xs text-muted-foreground">
                    You have not taken any loans from the circle yet. Whenever an emergency arises, your community is here for you.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {userLoans.map((loan) => {
                    const remaining = Math.max(loan.amount - loan.repaid, 0);
                    const progressPercent = Math.round((loan.repaid / loan.amount) * 100);

                    return (
                      <div
                        key={loan.id}
                        onClick={() => setSelectedLoan(loan)}
                        className="cursor-pointer rounded-2xl border bg-card p-5 space-y-4 hover:border-primary/50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground">{loan.id}</span>
                            <h4 className="font-display text-base font-bold text-foreground mt-0.5">
                              {loan.purpose}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Requested on {formatDate(loan.date)}
                            </p>
                          </div>
                          <StatusChip status={loan.status} />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Repayment Progress</span>
                            <span className="font-bold text-foreground">{progressPercent}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-muted-foreground">
                              Repaid: <strong className="text-emerald-700 dark:text-emerald-400">₹{loan.repaid.toLocaleString('en-IN')}</strong>
                            </span>
                            <span className="text-muted-foreground">
                              Remaining: <strong className="text-foreground">₹{remaining.toLocaleString('en-IN')}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span>Principal: </span>
                            <strong className="text-foreground">₹{loan.amount.toLocaleString('en-IN')}</strong>
                            <span className="text-[10px]">({loan.months} mo)</span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-primary font-bold">
                            Details →
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Guaranteed Loans by this user */}
            {guaranteedLoans.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-display text-base font-bold flex items-center gap-2">
                  <HeartHandshake size={18} className="text-primary" />
                  <span>Loans You Vouched & Guaranteed</span>
                </h3>
                <div className="divide-y rounded-2xl border">
                  {guaranteedLoans.map((l) => (
                    <div key={l.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">Loan {l.id} — {l.purpose}</p>
                        <p className="text-muted-foreground text-[11px]">
                          Borrower ID: {l.userId} · Amount: ₹{l.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <StatusChip status={l.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENT & CONTRIBUTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-primary" />
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                    Audit Trail & Receipts
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold mt-1">
                  My Contribution Records
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Every deposit made by your account is verified with immutable cryptographic receipt hash.
                </p>
              </div>

              <Button
                onClick={() => setContributeModalOpen(true)}
                className="gap-2 rounded-xl text-xs font-bold shadow-md shadow-primary/20"
              >
                <Wallet size={15} />
                <span>Make Contribution</span>
              </Button>
            </div>

            {/* Contributions List */}
            {allDisplayPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground space-y-2">
                <Receipt size={32} className="mx-auto text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">No recorded payments</p>
                <p className="text-xs text-muted-foreground">
                  Use the Contribute button to deposit your monthly commitment.
                </p>
              </div>
            ) : (
              <div className="divide-y rounded-2xl border overflow-hidden">
                {allDisplayPayments.map((c) => {
                  const emergencySplit = c.type === 'Voluntary' ? c.amount : Math.round(c.amount * 0.7);
                  const wealthSplit = c.type === 'Voluntary' ? 0 : c.amount - emergencySplit;

                  return (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex size-10 items-center justify-center rounded-2xl ${
                          c.type === 'Voluntary' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-primary/10 text-primary'
                        }`}>
                          {c.type === 'Voluntary' ? <Gift size={18} /> : <Wallet size={18} />}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {c.title}
                            </span>
                            <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 text-[10px] font-bold">
                              Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Paid on {formatDate(c.date)} · Receipt #{c.hash ? c.hash.slice(0, 14) : c.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right">
                        <div className="hidden sm:block text-[10px] text-muted-foreground">
                          <div>70% Emergency: <strong>₹{emergencySplit}</strong></div>
                          {wealthSplit > 0 && <div>30% Chit Pot: <strong>₹{wealthSplit}</strong></div>}
                        </div>

                        <div className="border-l pl-4">
                          <Money amount={c.amount} className="font-display text-base font-extrabold text-foreground" />
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            UPI / Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ContributeModal
        isOpen={contributeModalOpen}
        onClose={() => {
          setContributeModalOpen(false);
          queryClient.invalidateQueries();
        }}
      />

      <RequestLoanModal
        isOpen={requestLoanModalOpen}
        onClose={() => {
          setRequestLoanModalOpen(false);
          queryClient.invalidateQueries();
        }}
        members={members}
        maxLoan={circle?.maxLoan || 50000}
        availableBalance={wealthOverview?.emergencyPool ?? Math.round((circle?.balance || 10000) * 0.7)}
      />

      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onPaid={() => {
            queryClient.invalidateQueries();
          }}
        />
      )}
    </div>
  );
}
