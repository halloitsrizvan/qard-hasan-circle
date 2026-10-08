import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient, useSuspenseQuery, useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  Filter,
  Layers,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
  AlertCircle,
  X,
  QrCode,
  Building,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money, StatusChip, formatDate } from '@/components/shared';
import { circleQueries, contributionService } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import type { Contribution, User, Membership, LedgerEntry } from '@/lib/types';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthlyCommitmentTrackerProps {
  currentYear?: number;
}

interface ConfirmPaymentTarget {
  member: { user: User; membership: Membership };
  monthIdx: number;
}

export function MonthlyCommitmentTracker({ currentYear = 2026 }: MonthlyCommitmentTrackerProps) {
  const queryClient = useQueryClient();
  const { user: currentUser, circle } = useDemo();
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const { data: contributions = [] } = useSuspenseQuery(circleQueries.contributions);
  const { data: ledger = [] } = useQuery(circleQueries.ledger);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'focused'>('matrix');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(9); // 0-indexed: 9 = October
  const [recordingForUser, setRecordingForUser] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmPaymentTarget, setConfirmPaymentTarget] = useState<ConfirmPaymentTarget | null>(null);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Bank'>('UPI');
  const [paymentNote, setPaymentNote] = useState('');

  const currentMonthIdx = 9; // October 2026 in the demo system context

  // Filter members belonging to this circle
  const activeMembers = members.filter((m) => m.user.role !== 'Super Admin');

  // Helper to parse join month (0-indexed)
  const getJoinMonthIndex = (joinedAtStr?: string): number => {
    if (!joinedAtStr) return 0;
    try {
      const d = new Date(joinedAtStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        if (year < currentYear) return 0; // Joined in a previous year -> active from Jan
        if (year > currentYear) return 12; // Joins in future year
        return d.getMonth();
      }
    } catch {}
    return 0;
  };

  // Check payment status for a specific member and month index
  const getMemberMonthStatus = (member: { user: User; membership: Membership }, monthIdx: number) => {
    const joinIdx = getJoinMonthIndex(member.user.joinedAt || member.membership.joinedAt);
    const monthlyCommitment = member.user.monthlyCommitment ?? member.membership.monthlyCommitment ?? circle?.minContribution ?? 1000;

    // Rule: Before join month -> NOT enrolled, NOT pending
    if (monthIdx < joinIdx) {
      return {
        status: 'not_started' as const,
        label: 'Not Joined',
        joinedMonthName: MONTH_NAMES[joinIdx],
        amount: 0,
        paidDate: null
      };
    }

    // 1. Check if a paid regular contribution exists for this member in contributions table
    const matchingPayment = contributions.find((c) => {
      if (c.status !== 'Paid' || c.type === 'Voluntary') return false;
      const cDate = new Date(c.date);
      if (isNaN(cDate.getTime()) || cDate.getMonth() !== monthIdx || cDate.getFullYear() !== currentYear) return false;

      // Direct userId match
      if (c.userId === member.user.id) return true;

      // Match by email if userId in contribution is an email or Firebase UID
      if (member.user.email && c.userId === member.user.email) return true;

      // Match if c.userId belongs to a user with matching email or name
      const contUser = members.find((m) => m.user.id === c.userId)?.user;
      if (contUser) {
        if (member.user.email && contUser.email && contUser.email.toLowerCase() === member.user.email.toLowerCase()) return true;
        if (contUser.name && member.user.name && contUser.name.toLowerCase() === member.user.name.toLowerCase()) return true;
      }

      return false;
    });

    // 2. Also check if a tamper-evident entry exists in ledger (e.g. LE-mahallu-001 "Abdul Kareem · regular pool contribution")
    const matchingLedger = !matchingPayment ? ledger.find((e) => {
      if (e.type !== 'Contribution') return false;
      const eDate = new Date(e.date);
      if (isNaN(eDate.getTime()) || eDate.getMonth() !== monthIdx || eDate.getFullYear() !== currentYear) return false;

      const desc = e.description.toLowerCase();
      const memName = member.user.name.toLowerCase();

      // Check if description includes member name and is a regular contribution
      if (desc.includes(memName)) {
        if (!desc.includes('voluntary') && !desc.includes('sadaqah')) {
          return true;
        }
      }
      return false;
    }) : null;

    if (matchingPayment || matchingLedger) {
      return {
        status: 'paid' as const,
        label: 'Paid',
        amount: matchingPayment?.amount ?? matchingLedger?.amount ?? monthlyCommitment,
        paidDate: matchingPayment?.date ?? matchingLedger?.date ?? null,
        contributionId: matchingPayment?.id ?? matchingLedger?.id
      };
    }

    // After current active month -> Upcoming
    if (monthIdx > currentMonthIdx) {
      return {
        status: 'upcoming' as const,
        label: 'Upcoming',
        amount: monthlyCommitment,
        paidDate: null
      };
    }

    // Joined and current/past month without payment -> Pending
    return {
      status: 'pending' as const,
      label: 'Pending',
      amount: monthlyCommitment,
      paidDate: null
    };
  };

  // Record payment handler for a specific member and month
  const handleMarkPayment = async (member: { user: User; membership: Membership }, monthIdx: number) => {
    const commitment = member.user.monthlyCommitment ?? member.membership.monthlyCommitment ?? circle?.minContribution ?? 1000;
    const formattedDate = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}-15`;
    const actionKey = `${member.user.id}-${monthIdx}`;

    setRecordingForUser(actionKey);
    try {
      await contributionService.create({
        userId: member.user.id,
        amount: commitment,
        date: formattedDate,
        type: 'Regular',
        status: 'Paid',
        circleId: circle?.id || 'mahallu'
      });

      toast.success(
        `Recorded ₹${commitment.toLocaleString('en-IN')} contribution for ${member.user.name} (${FULL_MONTH_NAMES[monthIdx]} ${currentYear})!`,
        {
          description: `Method: ${paymentMode} · Reconciled to dual pool (70% Emergency / 30% Chit) and logged to ledger.`
        }
      );
      await queryClient.invalidateQueries();
      setConfirmPaymentTarget(null);
      setPaymentNote('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setRecordingForUser(null);
    }
  };

  // Filtered members list
  const filteredMembers = activeMembers.filter((m) => {
    const nameMatch = m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user.phone && m.user.phone.includes(searchQuery));
    if (!nameMatch) return false;

    if (statusFilter === 'all') return true;
    const currentMonthStatus = getMemberMonthStatus(m, currentMonthIdx).status;
    if (statusFilter === 'pending') return currentMonthStatus === 'pending';
    if (statusFilter === 'paid') return currentMonthStatus === 'paid';
    return true;
  });

  // Calculate high-level metrics for current month
  const currentMonthEnrolledMembers = activeMembers.filter((m) => getJoinMonthIndex(m.user.joinedAt || m.membership.joinedAt) <= currentMonthIdx);
  const totalMonthlyCommitmentExpected = currentMonthEnrolledMembers.reduce(
    (sum, m) => sum + (m.user.monthlyCommitment ?? m.membership.monthlyCommitment ?? circle?.minContribution ?? 1000),
    0
  );

  const currentMonthPaidMembers = currentMonthEnrolledMembers.filter((m) => getMemberMonthStatus(m, currentMonthIdx).status === 'paid');
  const currentMonthPaidAmount = currentMonthPaidMembers.reduce(
    (sum, m) => sum + (m.user.monthlyCommitment ?? m.membership.monthlyCommitment ?? circle?.minContribution ?? 1000),
    0
  );
  const currentMonthPendingMembers = currentMonthEnrolledMembers.filter((m) => getMemberMonthStatus(m, currentMonthIdx).status === 'pending');
  const currentMonthPendingAmount = totalMonthlyCommitmentExpected - currentMonthPaidAmount;
  const collectionRate = totalMonthlyCommitmentExpected > 0
    ? Math.round((currentMonthPaidAmount / totalMonthlyCommitmentExpected) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Metrics Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{FULL_MONTH_NAMES[currentMonthIdx]} Expected Pool</span>
            <Coins size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            <Money amount={totalMonthlyCommitmentExpected} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {currentMonthEnrolledMembers.length} active committed members
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Collected This Month</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            <Money amount={currentMonthPaidAmount} />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-emerald-600">{collectionRate}%</span> collected ({currentMonthPaidMembers.length}/{currentMonthEnrolledMembers.length})
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Pending Collections</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            <Money amount={currentMonthPendingAmount} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {currentMonthPendingMembers.length} members pending for {FULL_MONTH_NAMES[currentMonthIdx]}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Mahallu Dual Split</span>
            <ShieldCheck size={16} className="text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground">
            70% Emergency / 30% Chit
          </div>
          <p className="text-[11px] text-muted-foreground">
            Emergency Stake + Rotating Chit Pot
          </p>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search member by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9.5 pl-9 text-xs rounded-xl bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex rounded-xl bg-secondary/60 p-1 border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                statusFilter === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({activeMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all flex items-center gap-1 ${
                statusFilter === 'pending' ? 'bg-card text-amber-600 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Pending</span>
              <span className="size-4 rounded-full bg-amber-500/20 text-amber-700 text-[10px] flex items-center justify-center font-bold">
                {currentMonthPendingMembers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                statusFilter === 'paid' ? 'bg-card text-emerald-600 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Paid ({currentMonthPaidMembers.length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-secondary/60 p-1 border text-xs">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'matrix' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar size={13} />
              <span>12-Month Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('focused')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'focused' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers size={13} />
              <span>Month Focus</span>
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX VIEW: 12-Month Grid */}
      {viewMode === 'matrix' && (
        <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
          <div className="border-b bg-muted/40 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                {currentYear} Member Monthly Commitment Matrix
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Commitment starts strictly from each member's enrollment date. Prior months are marked non-applicable.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 text-[11px]">
                <span className="size-2 rounded-full bg-emerald-500" /> Paid
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 text-[11px]">
                <span className="size-2 rounded-full bg-amber-500" /> Pending (Click to Record)
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" /> Not Joined
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/20 text-[11px] font-bold text-muted-foreground">
                  <th className="py-3.5 pl-6 pr-3 min-w-[180px] sticky left-0 bg-card z-10 shadow-r">Member Name & Role</th>
                  <th className="py-3.5 px-3 min-w-[110px]">Commitment</th>
                  <th className="py-3.5 px-3 min-w-[100px]">Joined Date</th>
                  {MONTH_NAMES.map((m, idx) => (
                    <th
                      key={m}
                      className={`py-3.5 px-2 text-center min-w-[70px] ${
                        idx === currentMonthIdx
                          ? 'bg-primary/10 text-primary font-extrabold border-x border-primary/20'
                          : ''
                      }`}
                    >
                      {m}
                      {idx === currentMonthIdx && <span className="block text-[9px] font-normal text-primary">Active</span>}
                    </th>
                  ))}
                  <th className="py-3.5 pr-6 pl-3 text-right min-w-[100px]">2026 Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-8 text-center text-muted-foreground">
                      No members matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const commitment = member.user.monthlyCommitment ?? member.membership.monthlyCommitment ?? circle?.minContribution ?? 1000;
                    const joinIdx = getJoinMonthIndex(member.user.joinedAt || member.membership.joinedAt);

                    // Compute total paid in the year
                    const paidMonthsCount = MONTH_NAMES.reduce((acc, _, mIdx) => {
                      return acc + (getMemberMonthStatus(member, mIdx).status === 'paid' ? 1 : 0);
                    }, 0);
                    const totalPaidInYear = paidMonthsCount * commitment;

                    return (
                      <tr key={member.user.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Member Name */}
                        <td className="py-3 pl-6 pr-3 sticky left-0 bg-card group-hover:bg-muted/30 z-10">
                          <div className="font-bold text-foreground truncate max-w-[170px]">{member.user.name}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                              {member.user.role}
                            </span>
                            {member.user.phone && <span>· {member.user.phone}</span>}
                          </div>
                        </td>

                        {/* Monthly Commitment */}
                        <td className="py-3 px-3 font-mono font-bold text-foreground">
                          ₹{commitment.toLocaleString('en-IN')}<span className="text-[10px] text-muted-foreground font-normal">/mo</span>
                        </td>

                        {/* Joined At */}
                        <td className="py-3 px-3 text-muted-foreground text-[11px]">
                          {member.user.joinedAt ? formatDate(member.user.joinedAt) : 'Jan 2026'}
                        </td>

                        {/* 12 Months Cells */}
                        {MONTH_NAMES.map((mName, mIdx) => {
                          const monthState = getMemberMonthStatus(member, mIdx);
                          const isCurrentMonth = mIdx === currentMonthIdx;
                          const actionKey = `${member.user.id}-${mIdx}`;
                          const isProcessing = recordingForUser === actionKey;

                          return (
                            <td
                              key={mName}
                              className={`py-2 px-1 text-center ${
                                isCurrentMonth ? 'bg-primary/5 border-x border-primary/15' : ''
                              }`}
                            >
                              {monthState.status === 'not_started' && (
                                <span
                                  title={`Not joined yet (Joined in ${monthState.joinedMonthName})`}
                                  className="inline-block py-1 text-[11px] text-zinc-300 dark:text-zinc-700 font-bold"
                                >
                                  —
                                </span>
                              )}

                              {monthState.status === 'paid' && (
                                <span
                                  title={`Paid ₹${monthState.amount.toLocaleString('en-IN')} on ${monthState.paidDate || 'verified date'}`}
                                  className="inline-flex items-center justify-center size-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]"
                                >
                                  ✓
                                </span>
                              )}

                              {monthState.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => setConfirmPaymentTarget({ member, monthIdx: mIdx })}
                                  title={`Pending ₹${commitment.toLocaleString('en-IN')} for ${FULL_MONTH_NAMES[mIdx]}. Click to confirm payment.`}
                                  className="inline-flex items-center justify-center size-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold text-[10px] hover:bg-emerald-500 hover:text-white hover:border-emerald-600 transition-all cursor-pointer shadow-2xs group/btn"
                                >
                                  {isProcessing ? '...' : '!'}
                                </button>
                              )}

                              {monthState.status === 'upcoming' && (
                                <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted/40 text-muted-foreground/60 text-[10px]">
                                  ·
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Paid in Year */}
                        <td className="py-3 pr-6 pl-3 text-right font-mono font-bold text-foreground">
                          ₹{totalPaidInYear.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOCUSED VIEW: Specific Month Breakdown */}
      {viewMode === 'focused' && (
        <div className="space-y-4">
          {/* Month Selector Pills */}
          <div className="flex overflow-x-auto gap-1.5 rounded-2xl border bg-card p-2 shadow-soft">
            {FULL_MONTH_NAMES.map((name, idx) => {
              const isSelected = selectedMonthIdx === idx;
              const isCurrent = idx === currentMonthIdx;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedMonthIdx(idx)}
                  className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isCurrent
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div>{MONTH_NAMES[idx]}</div>
                  {isCurrent && <span className="text-[9px] font-normal block opacity-80">Current</span>}
                </button>
              );
            })}
          </div>

          {/* Focused Month Table */}
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="border-b bg-muted/40 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {FULL_MONTH_NAMES[selectedMonthIdx]} {currentYear} Contributions
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Member list for {FULL_MONTH_NAMES[selectedMonthIdx]}. Only members who joined on or before this month are active.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredMembers.map((member) => {
                const monthState = getMemberMonthStatus(member, selectedMonthIdx);
                const commitment = member.user.monthlyCommitment ?? member.membership.monthlyCommitment ?? circle?.minContribution ?? 1000;
                const actionKey = `${member.user.id}-${selectedMonthIdx}`;
                const isProcessing = recordingForUser === actionKey;

                return (
                  <div key={member.user.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary text-sm">
                        {member.user.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{member.user.name}</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {member.user.role} · Joined {member.user.joinedAt || 'Jan 2026'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Monthly Commitment</span>
                        <span className="font-mono font-bold text-foreground text-sm">₹{commitment.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="min-w-[120px]">
                        <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Status</span>
                        {monthState.status === 'not_started' && (
                          <span className="text-xs font-semibold text-muted-foreground/70">
                            — Not Joined Yet
                          </span>
                        )}
                        {monthState.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            ✓ Paid ({monthState.paidDate})
                          </span>
                        )}
                        {monthState.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                            ! Payment Pending
                          </span>
                        )}
                        {monthState.status === 'upcoming' && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            Scheduled
                          </span>
                        )}
                      </div>

                      <div>
                        {monthState.status === 'pending' && (
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setConfirmPaymentTarget({ member, monthIdx: selectedMonthIdx })}
                            className="gap-1.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>{isProcessing ? 'Recording...' : 'Mark as Paid'}</span>
                          </Button>
                        )}
                        {monthState.status === 'paid' && (
                          <span className="text-xs text-muted-foreground font-semibold">
                            Reconciled ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL */}
      {confirmPaymentTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !recordingForUser) {
                setConfirmPaymentTarget(null);
              }
            }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
          >
            <div className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">Confirm Payment Collection</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {circle?.mosque || 'Mahallu Qard Hasan Circle'} · Monthly Commitment
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmPaymentTarget(null)}
                  disabled={Boolean(recordingForUser)}
                  aria-label="Close modal"
                  className="size-8 rounded-lg hover:bg-muted"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Body */}
              <div className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
                {/* Member Summary Card */}
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary text-sm">
                      {confirmPaymentTarget.member.user.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{confirmPaymentTarget.member.user.name}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {confirmPaymentTarget.member.user.role} {confirmPaymentTarget.member.user.phone && `· ${confirmPaymentTarget.member.user.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                      ₹{(confirmPaymentTarget.member.user.monthlyCommitment ?? confirmPaymentTarget.member.membership.monthlyCommitment ?? circle?.minContribution ?? 1000).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Commitment</span>
                  </div>
                </div>

                {/* Target Month Indicator */}
                <div className="rounded-xl border bg-secondary/30 p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Target Month:</span>
                    <span className="font-bold text-foreground font-display text-sm">
                      {FULL_MONTH_NAMES[confirmPaymentTarget.monthIdx]} {currentYear}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Pending Collection
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Payment Mode / Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        paymentMode === 'UPI'
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <QrCode size={16} />
                      <span className="text-[11px]">UPI / QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('Cash')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        paymentMode === 'Cash'
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Banknote size={16} />
                      <span className="text-[11px]">Cash Counter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('Bank')}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        paymentMode === 'Bank'
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Building size={16} />
                      <span className="text-[11px]">Bank Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Reference / Note Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Transaction Ref / Note (Optional)</label>
                  <Input
                    placeholder="e.g. GPay Ref / Receipt # / Counter receipt"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Dual Split Breakdown */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
                    <Sparkles size={13} />
                    <span>Automatic Dual-Pool Partitioning</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="rounded-lg bg-background/80 p-2 border border-border">
                      <span className="text-muted-foreground block text-[10px]">70% Emergency Fund</span>
                      <span className="font-bold text-emerald-600 font-mono text-xs">
                        ₹{Math.round(((confirmPaymentTarget.member.user.monthlyCommitment ?? 1000) * 0.7)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="rounded-lg bg-background/80 p-2 border border-border">
                      <span className="text-muted-foreground block text-[10px]">30% Chit Savings Pot</span>
                      <span className="font-bold text-primary font-mono text-xs">
                        ₹{Math.round(((confirmPaymentTarget.member.user.monthlyCommitment ?? 1000) * 0.3)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-muted/40 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmPaymentTarget(null)}
                  disabled={Boolean(recordingForUser)}
                  className="rounded-xl border-input"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={Boolean(recordingForUser)}
                  onClick={() => handleMarkPayment(confirmPaymentTarget.member, confirmPaymentTarget.monthIdx)}
                  className="gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>{recordingForUser ? 'Recording...' : 'Confirm & Record Payment'}</span>
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

