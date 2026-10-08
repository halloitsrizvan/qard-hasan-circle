import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSuspenseQuery, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Download,
  Search,
  ShieldCheck,
  Users,
  Leaf,
  Check,
  HeartHandshake,
  Lock,
  Wallet,
  Database,
  RefreshCw,
  LogIn,
  LogOut,
  Key,
  Mail,
  Sparkles,
  UserPlus,
  HandCoins,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  FileText,
  Eye,
  EyeOff,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money, StatusChip, formatDate, PrinciplesNote, RoleGate } from '@/components/shared';
import { useDemo } from '@/lib/demo-context';
import { circleQueries, loanService, contributionService, circleService } from '@/lib/services';
import type { LedgerEntry, Role, Loan, Contribution, User, Membership } from '@/lib/types';
import { RequestLoanModal, ContributeModal, LoanDetailModal } from './modals';
import { MonthlyCommitmentTracker } from './monthly-commitment-tracker';
import { toast } from 'sonner';

export function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-[10px] font-semibold tracking-[.12em] text-primary">MAHALLU QARD HASAN CIRCLE</p>
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoansView() {
  const { data: loans } = useSuspenseQuery(circleQueries.loans);
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const { role, user, circle } = useDemo();
  const queryClient = useQueryClient();

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const handleVouch = async (loanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(loanId);
    try {
      await loanService.guarantee(loanId, user?.id || 'u4');
      toast.success('Guarantor confirmed! Request has been forwarded to the Committee.');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to vouch');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (loanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(loanId);
    try {
      await loanService.approveAndDisburse(loanId);
      toast.success('Loan approved! 0% interest principal disbursed.');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve loan');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayInstallment = async (loan: Loan, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(loan.id);
    try {
      const insts = await loanService.getInstallments(loan.id);
      const due = insts.find((i) => i.status !== 'Paid');
      if (!due) {
        toast.info('All installments for this loan are paid.');
        return;
      }
      await loanService.payInstallment(due.id, loan.id);
      toast.success(`Installment of ₹${due.amount.toLocaleString('en-IN')} paid successfully!`);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Real-time calculations
  const totalDisbursed = loans.reduce((sum, l) => sum + (['Active', 'Closed', 'Overdue'].includes(l.status) ? l.amount : 0), 0);
  const totalRepaid = loans.reduce((sum, l) => sum + (l.repaid || 0), 0);
  const activeCount = loans.filter((l) => l.status === 'Active').length;
  const requestedCount = loans.filter((l) => ['Requested', 'Guarantor pending'].includes(l.status)).length;

  const filtered = loans.filter((l) => {
    if (role === 'Guarantor' && l.guarantorId !== user?.id && statusFilter === 'Guaranteed by me') {
      return false;
    }
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active' && l.status !== 'Active') return false;
      if (statusFilter === 'Requested' && !['Requested', 'Guarantor pending'].includes(l.status)) return false;
      if (statusFilter === 'Closed' && l.status !== 'Closed') return false;
      if (statusFilter === 'Overdue' && l.status !== 'Overdue') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const borrower = members.find((m) => m.user.id === l.userId)?.user;
      const guarantor = members.find((m) => m.user.id === l.guarantorId)?.user;
      const matches =
        l.id.toLowerCase().includes(q) ||
        l.purpose.toLowerCase().includes(q) ||
        (borrower?.name.toLowerCase().includes(q) ?? false) ||
        (guarantor?.name.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold tracking-[.12em] text-primary uppercase">
              {circle?.mosque || 'Mahallu Qard Hasan Circle'}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
              </span>
              Live Sync
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {role === 'Guarantor' ? 'Your Guarantees & Requests' : 'Community Loans'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Principal-only Qard Hasan. Support when it matters most, returned with dignity.
          </p>
        </div>

        <Button onClick={() => setRequestModalOpen(true)} className="gap-2 rounded-xl text-xs font-bold shadow-sm">
          <HandCoins size={16} />
          <span>Request an Interest-Free Loan</span>
        </Button>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Active Loans</span>
            <HandCoins size={16} className="text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{activeCount}</p>
          <span className="text-[10px] text-muted-foreground">{requestedCount} pending review</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Disbursed</span>
            <Wallet size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <Money amount={totalDisbursed} className="font-display text-2xl font-bold text-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">0% interest Qard Hasan</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Total Repaid</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2">
            <Money amount={totalRepaid} className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[10px] text-muted-foreground">Recycled to fund next families</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Treasury Liquidity</span>
            <ShieldCheck size={16} className="text-purple-500" />
          </div>
          <div className="mt-2">
            <Money amount={circle?.balance ?? 150000} className="font-display text-2xl font-bold text-foreground" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready for disbursement</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Active', 'Requested', 'Closed', 'Overdue'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search loans, members, purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded-xl pl-8 text-xs bg-muted/30"
          />
        </div>
      </div>

      {role === 'Auditor' && (
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 border p-3 text-xs text-muted-foreground">
          <Lock size={14} /> 
          <span>Read-only auditor view: Inspecting cryptographic loan ledger and Shariah compliance logs.</span>
        </div>
      )}

      {/* Loans Grid / Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <HandCoins size={24} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">No loans found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'No loans match your search or filter criteria.'
                : 'There are currently no active loan requests in this circle.'}
            </p>
          </div>
          <Button onClick={() => setRequestModalOpen(true)} className="rounded-xl text-xs font-bold gap-1.5">
            <HandCoins size={14} />
            <span>Request Qard Hasan Loan</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4.5 md:grid-cols-2">
          {filtered.map((l) => {
            const own = l.userId === user?.id;
            const borrower = members.find((m) => m.user.id === l.userId)?.user;
            const isGuarantorPending = l.status === 'Guarantor pending' && role === 'Guarantor';
            const isRequested = l.status === 'Requested' && role === 'Committee Admin';
            const repaidPct = l.amount > 0 ? Math.min(100, Math.round(((l.repaid || 0) / l.amount) * 100)) : 0;

            return (
              <article
                key={l.id}
                onClick={() => setSelectedLoan(l)}
                className="group cursor-pointer rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:border-primary/50 hover:shadow-md relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg border border-border/60">
                      {l.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {l.isSelfCovered && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Sparkles size={10} className="text-emerald-500" />
                          Self-Covered Fast-Track
                        </span>
                      )}
                      <StatusChip status={l.status} />
                    </div>
                  </div>

                  <h2 className="mt-3.5 font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {role === 'Committee Admin' || own || role === 'Guarantor'
                      ? borrower?.name || 'Community Member'
                      : 'Community Member'}
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {role === 'Committee Admin' || own || role === 'Guarantor'
                      ? l.purpose
                      : 'Community support · identity kept private'}
                  </p>

                  <div className="my-4 flex items-baseline gap-2">
                    <Money amount={l.amount} className="text-3xl font-bold text-foreground font-mono" />
                    <span className="text-xs text-muted-foreground font-medium">({l.months} months tenure)</span>
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="space-y-1.5 border-t border-border/60 pt-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">
                        Repaid: <strong className="text-foreground"><Money amount={l.repaid} /></strong>
                      </span>
                      <span className="text-primary">{repaidPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          repaidPct >= 100 ? 'bg-emerald-500' : repaidPct > 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                        style={{ width: `${repaidPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                  {isGuarantorPending && (
                    <Button
                      size="sm"
                      onClick={(e) => handleVouch(l.id, e)}
                      disabled={actionLoading === l.id}
                      className="w-full gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                    >
                      <UserCheck size={14} />
                      {actionLoading === l.id ? 'Vouching...' : 'Vouch & Confirm Guarantee (Kafala)'}
                    </Button>
                  )}

                  {isRequested && (
                    <Button
                      size="sm"
                      onClick={(e) => handleApprove(l.id, e)}
                      disabled={actionLoading === l.id}
                      className="w-full gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-xs"
                    >
                      <CheckCircle2 size={14} />
                      {actionLoading === l.id ? 'Approving...' : 'Approve & Disburse 0% Qard'}
                    </Button>
                  )}

                  {own && l.status === 'Active' && l.repaid < l.amount && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handlePayInstallment(l, e)}
                      disabled={actionLoading === l.id}
                      className="w-full gap-1.5 text-xs font-bold rounded-xl"
                    >
                      <RotateCcw size={14} />
                      {actionLoading === l.id
                        ? 'Processing...'
                        : `Pay Next Monthly Installment (₹${Math.round(l.amount / l.months).toLocaleString('en-IN')})`}
                    </Button>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Click card to inspect ledger schedule</span>
                    <span className="font-semibold text-primary group-hover:underline">View details →</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <PrinciplesNote />
      </div>

      <RequestLoanModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        members={members}
        maxLoan={circle?.maxLoan ?? 50000}
        availableBalance={Math.round((circle?.balance || 10000) * 0.7)}
      />

      <LoanDetailModal
        loan={selectedLoan}
        onClose={() => setSelectedLoan(null)}
        borrowerName={members.find((m) => m.user.id === selectedLoan?.userId)?.user.name || 'Community Member'}
        guarantorName={members.find((m) => m.user.id === selectedLoan?.guarantorId)?.user.name}
      />
    </div>
  );
}

export function ContributionsView() {
  const { data: entries } = useSuspenseQuery(circleQueries.contributions);
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const { role, user, circle } = useDemo();
  const queryClient = useQueryClient();

  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      await contributionService.confirm(id);
      toast.success('Contribution confirmed and appended to ledger!');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Confirmation failed');
    } finally {
      setConfirming(null);
    }
  };

  const totalPaid = entries.filter((e) => e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
  const totalPending = entries.filter((e) => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);
  const paidCount = entries.filter((e) => e.status === 'Paid').length;
  const pendingCount = entries.filter((e) => e.status === 'Pending').length;

  const filtered = entries.filter((e) => {
    if (statusFilter !== 'All' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const member = members.find((m) => m.user.id === e.userId)?.user;
      const matches =
        e.id.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        (member?.name.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold tracking-[.12em] text-primary uppercase">
              {circle?.mosque || 'Mahallu Qard Hasan Circle'}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
              </span>
              Live Sync
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">A Little From Each of Us</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Our monthly contributions sustain the community pool for families in emergency need.
          </p>
        </div>

        <Button onClick={() => setContributeModalOpen(true)} className="gap-2 rounded-xl text-xs font-bold shadow-sm">
          <Wallet size={16} />
          <span>Make a Contribution</span>
        </Button>
      </div>

      {/* Real-Time Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Confirmed Pool</span>
            <Wallet size={16} className="text-primary" />
          </div>
          <div className="mt-2">
            <Money amount={totalPaid} className="font-display text-2xl font-bold text-foreground" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {paidCount} contributions reconciled
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Pending Verification</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-2">
            <Money amount={totalPending} className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-[10px] text-muted-foreground">{pendingCount} awaiting committee audit</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Active Members</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{members.length}</p>
          <span className="text-[10px] text-muted-foreground">Regular contributors</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Zero-Riba Status</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
          <span className="text-[10px] text-muted-foreground">Shariah Verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Paid', 'Pending'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search member, type, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 rounded-xl pl-8 text-xs bg-muted/30"
          />
        </div>
      </div>

      {/* Contributions Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">No contributions recorded yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'No contributions match your search or filter criteria.'
                : 'Start contributing to build and strengthen the zero-interest lending pool.'}
            </p>
          </div>
          <Button onClick={() => setContributeModalOpen(true)} className="rounded-xl text-xs font-bold gap-1.5 shadow-sm">
            <Wallet size={14} />
            <span>Make First Contribution</span>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Member</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Contribution Type</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  {role === 'Committee Admin' && <th className="px-5 py-3.5 text-right">Committee Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...filtered].reverse().map((e) => {
                  const member = members.find((m) => m.user.id === e.userId)?.user;
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                            {member?.initials || 'M'}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {role === 'Committee Admin' || e.userId === user?.id
                                ? member?.name || 'Circle Member'
                                : 'Circle Member'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">{e.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground">{formatDate(e.date)}</td>

                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-foreground">{e.type}</span>
                      </td>

                      <td className="px-5 py-3.5 font-bold font-mono text-[13px] text-foreground">
                        <Money amount={e.amount} />
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusChip status={e.status} />
                      </td>

                      {role === 'Committee Admin' && (
                        <td className="px-5 py-3.5 text-right">
                          {e.status === 'Pending' ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(e.id)}
                              disabled={confirming === e.id}
                              className="h-7 rounded-xl text-xs font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
                            >
                              <CheckCircle2 size={12} />
                              {confirming === e.id ? 'Reconciling...' : 'Confirm & Reconcile'}
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={13} />
                              <span>Reconciled</span>
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ContributeModal isOpen={contributeModalOpen} onClose={() => setContributeModalOpen(false)} />
    </div>
  );
}

export function LedgerView() {
  const { data: entries } = useSuspenseQuery(circleQueries.ledger);
  const { data: circle } = useSuspenseQuery(circleQueries.overview);
  const { role } = useDemo();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');

  const description = (e: LedgerEntry) =>
    role === 'Committee Admin'
      ? e.description
      : e.type === 'Contribution'
      ? 'Circle member · pool contribution'
      : e.description;

  const filtered = entries.filter(
    (e) =>
      (type === 'All' || e.type === type) &&
      `${e.id} ${description(e)} ${e.type}`.toLowerCase().includes(search.toLowerCase())
  );

  function exportCSV() {
    const rows = [
      ['ID', 'Date', 'Type', 'Description', 'Amount', 'Balance', 'Demo fingerprint'],
      ...filtered.map((e) => [e.id, e.date, e.type, description(e), e.amount, e.balance, e.hash])
    ];
    const blob = new Blob(
      [rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')],
      { type: 'text/csv;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mahallu-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function printLedger() {
    window.print();
  }

  return (
    <div className="page-enter">
      <PageIntro
        title="Every rupee, accounted for"
        description="A transparent, append-only record of contributions, disbursements, and repayments."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-primary font-medium">
          <ShieldCheck size={16} />
          {entries.length} reconciled entries · <Money amount={circle.available} /> balance
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={printLedger} className="gap-1.5 text-xs">
            <FileText size={14} /> Print Audit Sheet
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <label className="relative max-w-sm flex-1">
          <span className="sr-only">Search ledger</span>
          <Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="h-10 bg-card pl-9 text-xs"
          />
        </label>
        <select
          aria-label="Filter ledger type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border bg-card px-3 text-xs"
        >
          {['All', 'Contribution', 'Disbursement', 'Repayment'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="overflow-auto rounded-2xl border bg-card px-5 shadow-soft">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] text-muted-foreground">
              {['Date', 'Description', 'Type', 'Amount', 'Balance', 'Record Fingerprint'].map((t) => (
                <th key={t} className="py-4 font-medium">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filtered].reverse().map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="py-4 text-muted-foreground">{formatDate(e.date)}</td>
                <td>
                  <p className="font-medium">{description(e)}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">{e.id}</p>
                </td>
                <td>{e.type}</td>
                <td>
                  <Money amount={e.amount} sign className={e.amount > 0 ? 'text-primary' : 'text-foreground'} />
                </td>
                <td>
                  <Money amount={e.balance} />
                </td>
                <td>
                  <span
                    className="flex items-center gap-1 font-mono text-[10px] text-primary"
                    title={`Cryptographic demo fingerprint: ${e.hash}`}
                  >
                    <ShieldCheck size={12} />
                    {e.hash}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText size={20} />
            </div>
            <p className="text-xs font-bold text-foreground">No ledger transactions recorded yet</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Approved loans, repayments, disbursements, and contributions will be cryptographically chained here with SHA-256 hashes in real-time.
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Tamper-evident hash chain: previous block hashes are cryptographically chained to prevent retroactive modification.
      </p>
    </div>
  );
}

export function MembersView() {
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const { role: currentRole, circle } = useDemo();
  const queryClient = useQueryClient();

  const { data: allCircles = [] } = useQuery({
    queryKey: ['allCircles'],
    queryFn: () => circleService.getAllCircles()
  });

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [monthlyCommitment, setMonthlyCommitment] = useState('1000');
  const [selectedCircleId, setSelectedCircleId] = useState(circle?.id || 'mahallu');
  const [submitting, setSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const isSuperAdmin = currentRole === 'Super Admin';

  const handleRoleChange = async (userId: string, userName: string, newRole: Role) => {
    setUpdatingUserId(userId);
    try {
      await circleService.updateUserRole(userId, newRole);
      toast.success(`Role updated for ${userName} to ${newRole}!`);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error('Failed to update role: ' + (err.message || String(err)));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleMembership = async (membershipId: string, currentStatus: 'Active' | 'Pending', userName: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Pending' : 'Active';
    try {
      await circleService.updateMembershipStatus(membershipId, nextStatus);
      toast.success(`Membership for ${userName} is now ${nextStatus}`);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error('Failed to change status: ' + (err.message || String(err)));
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter name and email.');
      return;
    }
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await circleService.join({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        address: address.trim(),
        circleId: selectedCircleId || circle?.id || 'mahallu',
        monthlyCommitment: Number(monthlyCommitment) || 1000
      });
      toast.success('Joined Mahallu Circle successfully!', {
        description: 'New member account created with your credentials.'
      });
      await queryClient.invalidateQueries();
      setJoinModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setAddress('');
      setMonthlyCommitment('1000');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit join request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageIntro title="The People Behind the Pool" description="12 members. One shared commitment to care." />
        <RoleGate allowed={['Committee Admin']}>
          <Button onClick={() => setJoinModalOpen(true)} className="gap-2">
            <UserPlus size={16} />
            Join / Invite Member
          </Button>
        </RoleGate>
      </div>

      {isSuperAdmin && (
        <div className="rounded-2xl border border-gold/40 bg-gold-soft/50 p-4 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-gold-foreground">
            <Crown size={18} className="text-gold" />
            <span>Super Admin Authority Active</span>
          </div>
          <p className="mt-1 text-muted-foreground">
            You can reassign any user's role (Super Admin, Committee Admin, Member, Guarantor, Auditor) or toggle membership access in real time.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map(({ user, membership }) => (
          <article key={user.id} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-sm font-medium text-primary">
                {user.initials}
              </span>
              <div className="flex items-center gap-2">
                <StatusChip status={membership.status} />
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleMembership(membership.id, membership.status, user.name)}
                    className="text-[10px] text-muted-foreground underline hover:text-foreground"
                    title="Toggle Active/Pending status"
                  >
                    Toggle
                  </button>
                )}
              </div>
            </div>

            <h2 className="mt-4 font-display text-xl">{user.name}</h2>
            
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monthly Commitment:</span>
              <span className="font-mono font-bold text-foreground">
                <Money amount={user.monthlyCommitment ?? membership.monthlyCommitment ?? 1000} />
                <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
              </span>
            </div>

            {isSuperAdmin ? (
              <div className="mt-2 space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Assign Role</label>
                <select
                  value={user.role}
                  disabled={updatingUserId === user.id}
                  onChange={(e) => handleRoleChange(user.id, user.name, e.target.value as Role)}
                  className="w-full rounded-lg border bg-background py-1.5 px-2 text-xs font-medium text-foreground focus:outline-primary"
                >
                  <option value="Super Admin">Super Admin (👑 Full Control)</option>
                  <option value="Committee Admin">Committee Admin</option>
                  <option value="Member">Member</option>
                  <option value="Guarantor">Guarantor</option>
                  <option value="Auditor">Auditor (Read-Only)</option>
                </select>
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">{user.role}</p>
            )}

            <p className="mt-4 border-t pt-3 text-[10px] text-muted-foreground">Joined {formatDate(membership.joinedAt)}</p>
          </article>
        ))}
      </div>

      {joinModalOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => e.target === e.currentTarget && setJoinModalOpen(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0"
          >
            <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">Join Mahallu Circle</h2>
                    <p className="text-[11px] text-muted-foreground">Submit your community verification request</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setJoinModalOpen(false)} aria-label="Close modal">
                  <XCircle size={18} />
                </Button>
              </div>

              <form onSubmit={handleJoin} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Circle Invite Code</label>
                  <Input value="MAHALLU-2026" readOnly className="mt-1 bg-secondary text-xs font-mono font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Zaid Bin Haris"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="zaid@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Password (min 6 characters) *</label>
                  <div className="relative mt-1">
                    <Input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Monthly Commitment (₹)</label>
                    <Input
                      type="number"
                      min={100}
                      step={100}
                      value={monthlyCommitment}
                      onChange={(e) => setMonthlyCommitment(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Building2 size={13} className="text-primary" />
                      <span>Mahallu Circle</span>
                    </label>
                    <select
                      value={selectedCircleId}
                      onChange={(e) => setSelectedCircleId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-primary"
                    >
                      {allCircles && allCircles.length > 0 ? (
                        allCircles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <option value={circle?.id || 'mahallu'}>{circle?.name || 'Mahallu Qard Hasan Circle'}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Phone (Optional)</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Mahallu / Residence</label>
                  <Input
                    placeholder="e.g. Near Perinthalmanna Juma Masjid"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setJoinModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Join Mahallu Circle'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function CommitteeView() {
  const { role } = useDemo();
  const { data: loans } = useSuspenseQuery(circleQueries.loans);
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'tracker' | 'loans'>('tracker');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApproveAndDisburse = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      await loanService.approveAndDisburse(loanId);
      toast.success('Loan approved & disbursed! Ledger updated with disbursal entry.');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      await loanService.reject(loanId, 'Committee decision');
      toast.info('Loan request declined.');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Decline failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleHardshipWaive = async (loanId: string) => {
    setProcessingId(loanId);
    try {
      await loanService.waive(loanId, 'Compassionate hardship waiver');
      toast.success('Remaining loan waived as community Sadaqah.');
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Waiver failed');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingLoans = loans.filter((l) => ['Requested', 'Guarantor pending'].includes(l.status));
  const activeLoans = loans.filter((l) => l.status === 'Active' || l.status === 'Overdue');

  return (
    <div className="page-enter">
      <PageIntro title="Committee Console" description="Careful decisions. Compassionate support. Riba-free enforcement." />

      {role !== 'Committee Admin' && role !== 'Super Admin' ? (
        <div className="py-16 text-center">
          <Lock className="mx-auto text-primary" size={28} />
          <h2 className="mt-4 font-display text-xl">Committee Access Only</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Please switch to the <strong>Super Admin</strong> or <strong>Committee Admin</strong> demo role or log in with committee credentials.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b pb-4">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'tracker'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              }`}
            >
              <Users size={16} />
              <span>Monthly Commitment Tracker</span>
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'loans'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              }`}
            >
              <HeartHandshake size={16} />
              <span>Loan Requests & Hardship</span>
              {pendingLoans.length > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'loans' ? 'bg-primary-foreground text-primary' : 'bg-amber-500 text-white'
                }`}>
                  {pendingLoans.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'tracker' ? (
            <MonthlyCommitmentTracker currentYear={2026} />
          ) : (
            <div className="space-y-8">
              {/* Pending Loan Requests */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg">Loan Requests Awaiting Decision ({pendingLoans.length})</h2>
                </div>

                {pendingLoans.length === 0 ? (
                  <div className="rounded-2xl border bg-card p-8 text-center text-xs text-muted-foreground">
                    No loan requests currently awaiting review.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pendingLoans.map((l) => {
                      const borrower = members.find((m) => m.user.id === l.userId)?.user;
                      const guarantor = members.find((m) => m.user.id === l.guarantorId)?.user;

                      return (
                        <article key={l.id} className="rounded-2xl border bg-card p-6 shadow-soft space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-mono font-semibold">{l.id}</span>
                            <div className="flex items-center gap-1.5">
                              {l.isSelfCovered && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                  <Sparkles size={10} className="text-emerald-500" />
                                  Self-Covered Fast-Track
                                </span>
                              )}
                              <StatusChip status={l.status} />
                            </div>
                          </div>

                          <div>
                            <h3 className="font-display text-xl font-bold">{borrower?.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">{l.purpose}</p>
                          </div>

                          <div className="rounded-xl border bg-secondary/30 p-3 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Guarantor:</span>
                              <span className="font-medium">{l.isSelfCovered ? '✨ Self-Backed (Emergency Stake)' : (guarantor?.name || 'Assigned Member')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Repayment:</span>
                              <span className="font-medium">{l.months} monthly installments</span>
                            </div>
                          </div>

                          <Money amount={l.amount} className="block text-3xl font-semibold font-mono" />

                          <div className="flex gap-2 border-t pt-4">
                            <Button
                              onClick={() => handleApproveAndDisburse(l.id)}
                              disabled={processingId === l.id}
                              className="flex-1 gap-1.5 text-xs font-bold bg-primary text-primary-foreground"
                            >
                              <CheckCircle2 size={14} />
                              {processingId === l.id ? 'Disbursing...' : l.isSelfCovered ? '⚡ Fast-Track Disburse' : 'Approve & Disburse'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleReject(l.id)}
                              disabled={processingId === l.id}
                              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                            >
                              <XCircle size={14} /> Decline
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Hardship & Active Loans Oversight */}
              <section className="rounded-2xl border bg-card p-6 shadow-soft">
                <h2 className="font-display text-lg">Active Loans & Compassionate Hardship Relief</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  In accordance with Shariah principles, difficult circumstances are met with flexibility, rescheduling, or
                  charity waivers without late penalties.
                </p>

                <div className="mt-4 divide-y">
                  {activeLoans.map((l) => {
                    const borrower = members.find((m) => m.user.id === l.userId)?.user;
                    return (
                      <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-xs font-semibold">{borrower?.name} ({l.id})</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {l.purpose} · <Money amount={l.repaid} /> of <Money amount={l.amount} /> repaid
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusChip status={l.status} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleHardshipWaive(l.id)}
                            disabled={processingId === l.id}
                            className="h-7 text-[11px] text-primary hover:bg-primary/10"
                          >
                            Waive as Sadaqah
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const principles = [
  ['No interest', 'Only the amount borrowed is repaid. No more, no less.'],
  ['No lender-benefit fees', 'There are no processing fees or hidden charges.'],
  ['No penalties as income', 'A late repayment never becomes a source of profit.'],
  ['Documented agreements', 'Clear terms protect both the borrower and the community.'],
  ['Ease in hardship', 'We meet difficulty with compassion, flexibility, and dignity.'],
  ['Transparency', 'Every movement of money is recorded in our shared ledger.'],
  ['Scholar review', 'Reviewed by local Shariah scholars for authentic Qard Hasan adherence.']
];

export function RulesView() {
  const { circle } = useDemo();
  return (
    <div className="page-enter">
      <PageIntro
        title="Rooted in trust. Guided by principle."
        description="Qard hasan is a beautiful loan: support freely given, with principal alone returned."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { title: 'Minimum contribution', value: <Money amount={circle?.minContribution ?? 500} /> },
          { title: 'Maximum loan', value: <Money amount={circle?.maxLoan ?? 50000} /> },
          { title: 'Repayment term', value: 'Up to 12 months' },
          { title: 'Guarantor', value: 'Required' }
        ].map((r) => (
          <div key={r.title} className="rounded-2xl border bg-card p-5">
            <p className="text-[10px] text-muted-foreground">{r.title}</p>
            <p className="mt-2 text-sm font-semibold">{r.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        {principles.map(([title, body], i) => (
          <section key={title} className="flex gap-4 border-b py-6 md:pr-8">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs text-primary">
              0{i + 1}
            </span>
            <div>
              <h2 className="font-display text-xl">{title}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{body}</p>
            </div>
          </section>
        ))}
      </div>
      <blockquote className="mt-8 border-l-2 border-gold py-2 pl-5">
        <p className="font-display text-lg">Clarity is an act of care.</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Quran 2:282 emphasizes documenting debts and agreements. Our shared records honor that principle through
          clarity and mutual understanding.
        </p>
      </blockquote>
    </div>
  );
}

export function SettingsView() {
  const {
    user,
    role,
    dark,
    toggleTheme,
    isFirebaseUser,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    syncWithFirestore
  } = useDemo();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Member');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please provide both email and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      if (authMode === 'signup') {
        if (!name.trim()) {
          toast.error('Please enter your full name.');
          setLoadingAuth(false);
          return;
        }
        await signUpWithEmail(email, password, name, selectedRole);
        toast.success(`Account created and signed in as ${name}!`);
      } else {
        await signInWithEmail(email, password);
        toast.success('Successfully signed in with Firebase Auth!');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingAuth(true);
    try {
      await signInWithGoogle();
      toast.success('Signed in with Google!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Google sign-in error.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.info('Signed out. Switched back to demo persona.');
    } catch (err: any) {
      toast.error(err.message || 'Sign out failed.');
    }
  };

  const handleSyncDB = async (force = false) => {
    setSyncing(true);
    try {
      const res = await syncWithFirestore(force);
      if (res.success) {
        toast.success(res.message);
        await queryClient.invalidateQueries();
      } else {
        toast.warning(res.message);
      }
    } catch (err: any) {
      toast.error('Failed to sync Firestore: ' + (err.message || String(err)));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page-enter">
      <PageIntro title="Your Profile & Settings" description="Manage your account, Firebase connection, and appearance." />

      <div className="max-w-2xl space-y-8">
        {/* Profile Card */}
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-primary">
                {user?.initials || 'U'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl">{user?.name}</h2>
                  {isFirebaseUser && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Firebase Auth
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
            {isFirebaseUser && (
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5 text-xs">
                <LogOut size={14} /> Sign out
              </Button>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t pt-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user?.email || 'None'}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Account Type</dt>
              <dd className="font-medium">{isFirebaseUser ? 'Authenticated Firebase User' : 'Interactive Demo Persona'}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Active Circle</dt>
              <dd className="font-medium">Mahallu Qard Hasan Circle (Perinthalmanna)</dd>
            </div>
          </dl>
        </section>

        {/* Firebase Database Status & Management */}
        <section className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Database size={20} />
              <h2 className="font-display text-lg">Firebase Database (Firestore)</h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Connected
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Connected to Firebase project <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">hojathon-85be6</code>.
            All collections (circles, users, memberships, contributions, loans, installments, and transparent ledger) are mapped through typed Firestore services.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={() => handleSyncDB(false)}
              className="gap-2 text-xs"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Firestore DB'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={syncing}
              onClick={() => handleSyncDB(true)}
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Force Re-seed Collections
            </Button>
          </div>
        </section>

        {/* Firebase Authentication */}
        {!isFirebaseUser ? (
          <section className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Key size={18} />
                <h2 className="font-display text-lg">Firebase Authentication</h2>
              </div>
              <div className="flex rounded-lg border bg-secondary/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    authMode === 'signin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    authMode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {authMode === 'signin'
                ? 'Sign in with your Firebase account credentials or Google.'
                : 'Create a new Firebase account to contribute or request interest-free loans.'}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Full Name</label>
                    <Input
                      placeholder="e.g. Fatima Zahra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 h-9 bg-background text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Community Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="mt-1 block h-9 w-full rounded-md border bg-background px-3 text-xs"
                    >
                      <option value="Member">Member</option>
                      <option value="Guarantor">Guarantor</option>
                      <option value="Committee Admin">Committee Admin</option>
                      <option value="Auditor">Auditor</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-9 bg-background text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-9 bg-background text-xs"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={loadingAuth} className="gap-2 text-xs">
                  {authMode === 'signin' ? <LogIn size={14} /> : <UserPlus size={14} />}
                  {loadingAuth ? 'Processing...' : authMode === 'signin' ? 'Sign In with Email' : 'Create Account'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingAuth}
                  onClick={handleGoogleSignIn}
                  className="gap-2 text-xs"
                >
                  <Sparkles size={14} className="text-gold" />
                  Continue with Google
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check size={20} />
              </span>
              <div>
                <h3 className="font-display text-base">You are signed in</h3>
                <p className="text-xs text-muted-foreground">
                  Your session is actively authenticated with Firebase Auth.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Appearance & Theme */}
        <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-soft">
          <div>
            <h2 className="font-display text-lg">Appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">{dark ? 'Dark' : 'Light'} theme active</p>
          </div>
          <Button variant="outline" onClick={toggleTheme} className="text-xs">
            {dark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          </Button>
        </section>
      </div>
    </div>
  );
}
