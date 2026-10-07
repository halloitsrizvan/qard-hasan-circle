import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  Wallet,
  Sparkles,
  X,
  ArrowRight,
  RotateCcw,
  HeartHandshake,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money } from '@/components/shared';
import { loanService, contributionService } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import type { Loan, User, Membership } from '@/lib/types';
import { toast } from 'sonner';

// Reusable custom hook for modal accessibility (Escape key, body scroll lock & portal mounting)
function useModalHelper(isOpen: boolean, onClose: () => void) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  return mounted;
}

interface RequestLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: { user: User; membership: Membership }[];
  maxLoan?: number;
  availableBalance?: number;
}

export function RequestLoanModal({
  isOpen,
  onClose,
  members,
  maxLoan = 50000,
  availableBalance = 150000
}: RequestLoanModalProps) {
  const { user } = useDemo();
  const queryClient = useQueryClient();
  const mounted = useModalHelper(isOpen, onClose);

  const [amount, setAmount] = useState(30000);
  const [purpose, setPurpose] = useState('Mother’s surgery (Medical emergency)');
  const [months, setMonths] = useState(6);
  const [guarantorId, setGuarantorId] = useState(members[3]?.user.id || 'u4');
  const [attemptFee, setAttemptFee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !mounted) return null;

  const purposeOptions = [
    'Mother’s surgery (Medical emergency)',
    'Children’s higher education tuition',
    'Small business equipment support',
    'Urgent family home repairs',
    'Essential household emergency'
  ];

  const eligibleGuarantors = members.filter((m) => m.user.id !== user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (attemptFee) {
      toast.error('Violation: Riba and processing fees are strictly forbidden in Qard Hasan.', {
        description: 'Total repayable must equal principal alone. No fees permitted.'
      });
      return;
    }

    if (amount > availableBalance) {
      toast.error(`Requested amount exceeds current pool balance (₹${availableBalance.toLocaleString('en-IN')}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await loanService.request({
        userId: user?.id || 'u2',
        amount,
        purpose,
        months,
        guarantorId
      });
      toast.success('Loan request submitted successfully!', {
        description: 'Awaiting guarantor vouching & committee review.'
      });
      await queryClient.invalidateQueries();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HandCoins size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Request an Interest-Free Loan</h2>
              <p className="text-[11px] text-muted-foreground">Zero interest, 100% principal repayable</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="size-8 rounded-lg hover:bg-muted">
            <X size={18} />
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <form id="loan-request-form" onSubmit={handleSubmit} className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-foreground">Loan Amount</span>
              <span className="font-semibold text-primary">
                <Money amount={amount} /> <span className="text-muted-foreground">(Max: <Money amount={maxLoan} />)</span>
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={maxLoan}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer rounded-lg bg-secondary accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>₹5,000</span>
              <span>₹25,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Purpose Category</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {purposeOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Repayment Term</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {[3, 4, 6, 8, 10, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} months (₹{Math.round(amount / m).toLocaleString('en-IN')}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Community Guarantor</label>
              <select
                value={guarantorId}
                onChange={(e) => setGuarantorId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {eligibleGuarantors.map((g) => (
                  <option key={g.user.id} value={g.user.id}>
                    {g.user.name} ({g.user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Anti-Riba Shariah Breakdown */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck size={16} />
              <span>Shariah-Enforced Calculation (Quran 2:282)</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Principal borrowed:</span>
                <span className="font-semibold text-foreground"><Money amount={amount} /></span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Interest / Riba (0.0%):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹0.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Processing fee:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{attemptFee ? '₹500 (PROHIBITED)' : '₹0.00'}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
                <span>Total repayable:</span>
                <span className="text-sm font-bold text-primary">
                  <Money amount={amount + (attemptFee ? 500 : 0)} />
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Anti-Riba Tester */}
          <div className="rounded-xl border border-dashed border-rose-500/30 bg-rose-500/5 p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={attemptFee}
                onChange={(e) => setAttemptFee(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-rose-500"
              />
              <div className="text-[11px]">
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Demo Test: Try adding a ₹500 "processing fee"
                </span>
                <p className="mt-0.5 text-muted-foreground">
                  Observe how the system blocks submission to protect Shariah compliance.
                </p>
              </div>
            </label>
            {attemptFee && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-500/15 p-2 text-[11px] text-rose-700 dark:text-rose-300 font-medium border border-rose-500/20">
                <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                <span>Violation: Any fee benefiting the lender converts the loan into Riba.</span>
              </div>
            )}
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-muted/40 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-input">
            Cancel
          </Button>
          <Button form="loan-request-form" type="submit" disabled={isSubmitting || attemptFee} className="gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
            <HandCoins size={16} />
            {isSubmitting ? 'Submitting...' : 'Submit Loan Request'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const { user } = useDemo();
  const queryClient = useQueryClient();
  const mounted = useModalHelper(isOpen, onClose);

  const [amount, setAmount] = useState(15000);
  const [type, setType] = useState<'Regular' | 'Voluntary'>('Regular');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !mounted) return null;

  const presets = [500, 1000, 5000, 15000, 30000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      await contributionService.create({
        userId: user?.id || 'u2',
        amount,
        date: new Date().toISOString().slice(0, 10),
        type,
        status: 'Paid'
      });
      toast.success(`Contributed ₹${amount.toLocaleString('en-IN')} to the community pool!`, {
        description: 'Tamper-evident ledger has been updated.'
      });
      await queryClient.invalidateQueries();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Contribution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Contribute to the Pool</h2>
              <p className="text-[11px] text-muted-foreground">Strengthen the Mahallu mutual fund</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="size-8 rounded-lg hover:bg-muted">
            <X size={18} />
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <form id="contribute-form" onSubmit={handleSubmit} className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">Select Contribution Type</label>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('Regular')}
                className={`relative rounded-xl border p-3.5 text-left transition-all ${
                  type === 'Regular'
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <Coins size={15} className={type === 'Regular' ? 'text-primary' : 'text-muted-foreground'} />
                  <span>Regular Pool</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground leading-tight">Monthly community commitment</p>
                {type === 'Regular' && (
                  <div className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setType('Voluntary')}
                className={`relative rounded-xl border p-3.5 text-left transition-all ${
                  type === 'Voluntary'
                    ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500 shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <HeartHandshake size={15} className={type === 'Voluntary' ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'} />
                  <span>Sadaqah Jariyah</span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground leading-tight">Voluntary continuous charity</p>
                {type === 'Voluntary' && (
                  <div className="absolute top-2 right-2 size-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-foreground">
              <label>Amount (₹)</label>
              <span className="text-primary font-bold">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="relative mt-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
              <Input
                type="number"
                min={100}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-11 rounded-xl border-input bg-background pl-8 text-base font-bold text-foreground focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    amount === p
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                      : 'border-border bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px] mb-0.5">
              <Sparkles size={14} />
              <span>Barakah in Community Care</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              100% of your contribution directly fuels the emergency lending pool for families in need. Zero overheads, zero interest.
            </p>
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-border bg-muted/40 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl border-input">
            Cancel
          </Button>
          <Button
            form="contribute-form"
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Wallet size={16} />
            {isSubmitting ? 'Confirming...' : 'Confirm Contribution'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface LoanDetailModalProps {
  loan: Loan | null;
  onClose: () => void;
  borrowerName: string;
  guarantorName?: string | undefined;
}

export function LoanDetailModal({ loan, onClose, borrowerName, guarantorName }: LoanDetailModalProps) {
  const { user } = useDemo();
  const queryClient = useQueryClient();
  const mounted = useModalHelper(Boolean(loan), onClose);
  const [paying, setPaying] = useState<string | null>(null);

  if (!loan || !mounted) return null;

  const monthly = Math.round(loan.amount / loan.months);
  const remaining = loan.amount - loan.repaid;

  const handlePayInstallment = async () => {
    setPaying(loan.id);
    try {
      const installments = await loanService.getInstallments(loan.id);
      const nextDue = installments.find((i) => i.status !== 'Paid');
      if (!nextDue) {
        toast.info('All installments for this loan have already been paid.');
        return;
      }
      await loanService.payInstallment(nextDue.id, loan.id);
      toast.success(`Installment of ₹${nextDue.amount.toLocaleString('en-IN')} paid successfully!`);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Repayment failed');
    } finally {
      setPaying(null);
    }
  };

  const handleSponsorInstallment = async () => {
    setPaying(loan.id);
    try {
      const installments = await loanService.getInstallments(loan.id);
      const nextDue = installments.find((i) => i.status !== 'Paid');
      if (!nextDue) {
        toast.info('All installments for this loan have already been paid.');
        return;
      }
      const sponsorName = user?.name || 'Brother in Community';
      await loanService.sponsorInstallment(nextDue.id, loan.id, sponsorName);
      toast.success(`MashaAllah! Sponsored ₹${nextDue.amount.toLocaleString('en-IN')} for ${borrowerName}!`, {
        description: 'Recorded on ledger as voluntary Ibra’a / Sadaqah debt relief.'
      });
      await queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Sponsorship failed');
    } finally {
      setPaying(null);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{loan.id}</span>
            <h2 className="font-display text-lg font-semibold text-foreground">{borrowerName}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="size-8 rounded-lg hover:bg-muted">
            <X size={18} />
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5 text-center">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Principal</p>
              <p className="mt-1 font-bold text-foreground"><Money amount={loan.amount} /></p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Repaid</p>
              <p className="mt-1 font-bold text-primary"><Money amount={loan.repaid} /></p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Remaining</p>
              <p className="mt-1 font-bold text-foreground"><Money amount={remaining} /></p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-border/70 py-2">
              <span className="text-muted-foreground">Purpose</span>
              <span className="font-medium text-foreground">{loan.purpose}</span>
            </div>
            <div className="flex justify-between border-b border-border/70 py-2">
              <span className="text-muted-foreground">Guarantor</span>
              <span className="font-medium text-foreground">{guarantorName || 'Assigned Member'}</span>
            </div>
            <div className="flex justify-between border-b border-border/70 py-2">
              <span className="text-muted-foreground">Term</span>
              <span className="font-medium text-foreground">{loan.months} months (₹{monthly.toLocaleString('en-IN')}/month)</span>
            </div>
            <div className="flex justify-between border-b border-border/70 py-2">
              <span className="text-muted-foreground">Interest / Fees</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹0.00 (100% Riba-free)</span>
            </div>
          </div>

          {/* Compassionate Ibra'a / Sadaqah Relief Card */}
          {loan.status === 'Active' && remaining > 0 && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 mb-1">
                <HeartHandshake size={15} />
                <span>Debt Relief & Sponsorship (Quran 2:280)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If {borrowerName} is experiencing financial difficulty, any circle member can sponsor this monthly installment on their behalf as voluntary <em>Sadaqah Jariyah</em>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-input">
            Close
          </Button>

          {loan.status === 'Active' && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSponsorInstallment}
                disabled={paying === loan.id || remaining <= 0}
                className="gap-1.5 rounded-xl border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              >
                <HeartHandshake size={14} />
                <span>Sponsor for Brother</span>
              </Button>

              <Button
                onClick={handlePayInstallment}
                disabled={paying === loan.id || remaining <= 0}
                className="gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
              >
                <RotateCcw size={14} />
                {paying === loan.id ? 'Recording payment...' : `Pay ₹${monthly.toLocaleString('en-IN')}`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoTourModal({ isOpen, onClose }: DemoTourModalProps) {
  const { switchRole } = useDemo();
  const queryClient = useQueryClient();
  const mounted = useModalHelper(isOpen, onClose);
  const [step, setStep] = useState(1);
  const [executing, setExecuting] = useState(false);

  if (!isOpen || !mounted) return null;

  const tourSteps = [
    {
      step: 1,
      title: '1. Community Pool Overview',
      actor: 'Member (Rahim Mohammed)',
      desc: 'The Mahallu circle holds an interest-free pool of ₹1,50,000. Rahim needs ₹30,000 for his mother’s emergency surgery.',
      actionLabel: 'Switch to Rahim & Request Loan',
      execute: async () => {
        switchRole('Member');
        await loanService.request({
          userId: 'u2',
          amount: 30000,
          purpose: 'Mother’s surgery (Medical emergency)',
          months: 6,
          guarantorId: 'u4'
        });
        toast.success('Step 1 complete: Rahim submitted ₹30,000 loan request with guarantor Yusuf Ali.');
        await queryClient.invalidateQueries();
      }
    },
    {
      step: 2,
      title: '2. Guarantor Vouching',
      actor: 'Guarantor (Yusuf Ali)',
      desc: 'Yusuf Ali receives the guarantee request and vouches for Rahim in accordance with mutual community trust.',
      actionLabel: 'Switch to Yusuf & Vouch',
      execute: async () => {
        switchRole('Guarantor');
        const loans = await loanService.list();
        const pending = loans.find((l) => l.status === 'Guarantor pending');
        if (pending) {
          await loanService.guarantee(pending.id, 'u4');
          toast.success('Step 2 complete: Guarantor confirmed. Request routed to Committee.');
          await queryClient.invalidateQueries();
        }
      }
    },
    {
      step: 3,
      title: '3. Committee Approval & Disbursal',
      actor: 'Committee Admin (Abdul Kareem)',
      desc: 'Committee reviews the request and disburses the ₹30,000 principal. Pool balance updates to ₹1,20,000 with a verified ledger entry.',
      actionLabel: 'Switch to Committee & Disburse',
      execute: async () => {
        switchRole('Committee Admin');
        const loans = await loanService.list();
        const req = loans.find((l) => l.status === 'Requested');
        if (req) {
          await loanService.approveAndDisburse(req.id);
          toast.success('Step 3 complete: ₹30,000 disbursed and logged in tamper-evident ledger.');
          await queryClient.invalidateQueries();
        }
      }
    },
    {
      step: 4,
      title: '4. Zero-Interest Installment Repayment',
      actor: 'Member (Rahim Mohammed)',
      desc: 'Rahim repays the first monthly installment of ₹5,000 (100% principal, ₹0 interest). Pool balance recovers to ₹1,25,000.',
      actionLabel: 'Pay ₹5,000 Installment',
      execute: async () => {
        switchRole('Member');
        const loans = await loanService.list();
        const active = loans.find((l) => l.status === 'Active');
        if (active) {
          const insts = await loanService.getInstallments(active.id);
          const due = insts.find((i) => i.status !== 'Paid');
          if (due) {
            await loanService.payInstallment(due.id, active.id);
            toast.success('Step 4 complete: Installment received and credited back to pool.');
            await queryClient.invalidateQueries();
          }
        }
      }
    },
    {
      step: 5,
      title: '5. Anti-Riba Rule Protection',
      actor: 'System Auditor',
      desc: 'The core protocol rejects any transaction containing interest or lender-benefit fees. 100% Shariah-aligned and audit-ready.',
      actionLabel: 'Finish Demo Tour',
      execute: async () => {
        switchRole('Committee Admin');
        toast.success('Demo tour finished! All PRD scenarios demonstrated.');
        onClose();
      }
    }
  ];

  const current = (tourSteps[step - 1] ?? tourSteps[0])!;

  const handleNext = async () => {
    setExecuting(true);
    try {
      await current.execute();
      if (step < tourSteps.length) {
        setStep((s) => s + 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Step execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gold/15 text-gold-foreground">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">5-Minute Live Demo Tour</h2>
              <p className="text-[11px] text-muted-foreground">Interactive step-by-step walkthrough</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tour" className="size-8 rounded-lg hover:bg-muted">
            <X size={18} />
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-semibold text-primary">
              Step {step} of {tourSteps.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Actor: <span className="text-foreground font-semibold">{current.actor}</span></span>
          </div>

          <h3 className="font-display text-base font-semibold text-foreground">{current.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{current.desc}</p>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <CheckCircle2 size={16} />
              <span>Real-Time State Execution</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Clicking below will execute this step automatically and update the database & ledger in real time.
            </p>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/40 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || executing}
            className="rounded-xl"
          >
            Previous
          </Button>
          <Button onClick={handleNext} disabled={executing} className="gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
            {executing ? 'Executing...' : current.actionLabel}
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
