import { useState } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
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
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money, StatusChip, formatDate, PrinciplesNote } from '@/components/shared';
import { useDemo } from '@/lib/demo-context';
import { circleQueries, loanService, contributionService, circleService } from '@/lib/services';
import type { LedgerEntry, Role, Loan, Contribution, User, Membership } from '@/lib/types';
import { RequestLoanModal, ContributeModal, LoanDetailModal } from './modals';
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

  const filtered = role === 'Guarantor' ? loans.filter((l) => l.guarantorId === user?.id) : loans;

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

  return (
    <div className="page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageIntro
          title={role === 'Guarantor' ? 'Your Guarantees' : 'Community Loans'}
          description="Principal only. Support when it matters most, returned with dignity."
        />
        <Button onClick={() => setRequestModalOpen(true)} className="gap-2">
          <HandCoins size={16} />
          Request an Interest-Free Loan
        </Button>
      </div>

      {role === 'Auditor' && (
        <p className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock size={14} /> Read-only auditor view
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((l) => {
          const own = l.userId === user?.id;
          const borrower = members.find((m) => m.user.id === l.userId)?.user;
          const guarantor = members.find((m) => m.user.id === l.guarantorId)?.user;
          const isGuarantorPending = l.status === 'Guarantor pending' && role === 'Guarantor';

          return (
            <article
              key={l.id}
              onClick={() => setSelectedLoan(l)}
              className="cursor-pointer rounded-2xl border bg-card p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{l.id}</p>
                <StatusChip status={l.status} />
              </div>

              <h2 className="mt-4 font-display text-xl">
                {role === 'Committee Admin' || own || role === 'Guarantor'
                  ? borrower?.name || 'Community Member'
                  : 'Community member'}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {role === 'Committee Admin' || own || role === 'Guarantor'
                  ? l.purpose
                  : 'Community support · identity kept private'}
              </p>

              <Money amount={l.amount} className="my-5 block text-3xl font-semibold" />

              <div className="flex justify-between border-t pt-4 text-xs">
                <span className="text-muted-foreground">
                  Repaid <Money amount={l.repaid} />
                </span>
                <span>{l.months} months · No interest</span>
              </div>

              {/* Action buttons on card */}
              {isGuarantorPending && (
                <div className="mt-4 border-t pt-3">
                  <Button
                    size="sm"
                    onClick={(e) => handleVouch(l.id, e)}
                    disabled={actionLoading === l.id}
                    className="w-full gap-1.5 text-xs bg-gold-foreground text-gold-soft hover:bg-gold-foreground/90"
                  >
                    <UserCheck size={14} />
                    {actionLoading === l.id ? 'Vouching...' : 'Vouch & Confirm Guarantee'}
                  </Button>
                </div>
              )}

              {own && l.status === 'Active' && l.repaid < l.amount && (
                <div className="mt-4 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handlePayInstallment(l, e)}
                    disabled={actionLoading === l.id}
                    className="w-full gap-1.5 text-xs"
                  >
                    <RotateCcw size={14} />
                    {actionLoading === l.id ? 'Processing...' : `Pay Next Monthly Installment (₹${Math.round(l.amount / l.months)})`}
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-6">
        <PrinciplesNote />
      </div>

      <RequestLoanModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        members={members}
        maxLoan={circle?.maxLoan ?? 50000}
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
  const { role, user } = useDemo();
  const queryClient = useQueryClient();

  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

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

  const totalPaid = entries.filter((e) => e.status === 'Paid').reduce((s, e) => s+e.amount, 0);

  return (
    <div className="page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageIntro
          title="A little from each of us"
          description="Our contributions keep the circle ready for the next family in need."
        />
        <Button onClick={() => setContributeModalOpen(true)} className="gap-2">
          <Wallet size={16} />
          Make a Contribution
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-3 text-primary">
          <Wallet size={22} />
          <span className="text-xs font-medium">Total confirmed contributions</span>
        </div>
        <Money amount={totalPaid} className="mt-3 block text-4xl font-semibold" />
        <p className="mt-2 text-xs text-muted-foreground">{entries.length} contributions recorded from our community</p>
      </div>

      <div className="overflow-auto rounded-2xl border bg-card p-5 shadow-soft">
        <table className="w-full min-w-[500px] text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-4 font-medium">Member</th>
              <th className="pb-4 font-medium">Date</th>
              <th className="pb-4 font-medium">Type</th>
              <th className="pb-4 font-medium">Amount</th>
              <th className="pb-4 font-medium">Status</th>
              {role === 'Committee Admin' && <th className="pb-4 text-right font-medium">Action</th>}
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="py-4">
                  {role === 'Committee Admin' || e.userId === user?.id
                    ? members.find((m) => m.user.id === e.userId)?.user.name
                    : 'Circle member'}
                </td>
                <td>{formatDate(e.date)}</td>
                <td>{e.type}</td>
                <td>
                  <Money amount={e.amount} />
                </td>
                <td>
                  <StatusChip status={e.status} />
                </td>
                {role === 'Committee Admin' && (
                  <td className="text-right">
                    {e.status === 'Pending' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirm(e.id)}
                        disabled={confirming === e.id}
                        className="h-7 text-xs"
                      >
                        {confirming === e.id ? 'Confirming...' : 'Confirm'}
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Reconciled</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          <p className="py-12 text-center text-sm text-muted-foreground">No entries match this search.</p>
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
  const { role: currentRole } = useDemo();
  const queryClient = useQueryClient();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
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
    if (!name || !email) return;

    setSubmitting(true);
    try {
      await circleService.join({ name, email, phone, address });
      toast.success('Join request submitted!', {
        description: 'Committee will review and verify your membership.'
      });
      await queryClient.invalidateQueries();
      setJoinModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
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
        <Button onClick={() => setJoinModalOpen(true)} className="gap-2">
          <UserPlus size={16} />
          Join / Invite Member
        </Button>
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

            <p className="mt-5 border-t pt-3 text-[10px] text-muted-foreground">Joined {formatDate(membership.joinedAt)}</p>
          </article>
        ))}
      </div>

      {joinModalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setJoinModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0"
        >
          <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 text-primary">
                <UserPlus size={20} />
                <h2 className="font-display text-xl">Join Mahallu Circle</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setJoinModalOpen(false)} aria-label="Close modal">
                <XCircle size={18} />
              </Button>
            </div>

            <form onSubmit={handleJoin} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium">Circle Invite Code</label>
                <Input value="MAHALLU-2026" readOnly className="mt-1 bg-secondary text-xs font-mono font-semibold" />
              </div>
              <div>
                <label className="text-xs font-medium">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Zaid Bin Haris"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Email Address</label>
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
                <label className="text-xs font-medium">Phone (Optional)</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Mahallu / Residence</label>
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
                  {submitting ? 'Submitting...' : 'Submit Join Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommitteeView() {
  const { role } = useDemo();
  const { data: loans } = useSuspenseQuery(circleQueries.loans);
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const queryClient = useQueryClient();

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
                    <article key={l.id} className="rounded-2xl border bg-card p-6 shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{l.id}</span>
                        <StatusChip status={l.status} />
                      </div>

                      <h3 className="mt-3 font-display text-xl">{borrower?.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{l.purpose}</p>

                      <div className="my-4 rounded-xl border bg-secondary/30 p-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Guarantor:</span>
                          <span className="font-medium">{guarantor?.name || 'Assigned Member'}</span>
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span className="text-muted-foreground">Repayment:</span>
                          <span className="font-medium">{l.months} monthly installments</span>
                        </div>
                      </div>

                      <Money amount={l.amount} className="block text-3xl font-semibold" />

                      <div className="mt-5 flex gap-2 border-t pt-4">
                        <Button
                          onClick={() => handleApproveAndDisburse(l.id)}
                          disabled={processingId === l.id}
                          className="flex-1 gap-1.5 text-xs"
                        >
                          <CheckCircle2 size={14} />
                          {processingId === l.id ? 'Disbursing...' : 'Approve & Disburse'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(l.id)}
                          disabled={processingId === l.id}
                          className="text-xs text-rose-600 hover:text-rose-700"
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
