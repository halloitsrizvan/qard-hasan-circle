import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  HeartHandshake,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  Wallet,
  Sparkles,
  Info,
  Calendar,
  UserCheck,
  X,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money } from '@/components/shared';
import { loanService, contributionService, circleService } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import type { Loan, User, Membership } from '@/lib/types';
import { toast } from 'sonner';

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

  const [amount, setAmount] = useState(30000);
  const [purpose, setPurpose] = useState('Mother’s surgery (Medical emergency)');
  const [months, setMonths] = useState(6);
  const [guarantorId, setGuarantorId] = useState(members[3]?.user.id || 'u4');
  const [attemptFee, setAttemptFee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const purposeOptions = [
    'Mother’s surgery (Medical emergency)',
    'Children’s higher education tuition',
    'Small business equipment support',
    'Urgent family home repairs',
    'Essential household emergency'
  ];

  const eligibleGuarantors = members.filter((m) => m.user.id !== user?.id);
  const monthlyInstallment = Math.round(amount / months);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <HandCoins size={22} />
            <h2 className="font-display text-xl">Request an Interest-Free Loan</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <div className="flex justify-between text-xs font-medium">
              <span>Loan Amount</span>
              <span className="font-semibold text-primary">
                <Money amount={amount} /> (Max: <Money amount={maxLoan} />)
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={maxLoan}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>₹5,000</span>
              <span>₹25,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Purpose Category</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-medium"
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
              <label className="text-xs font-medium">Repayment Term</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-medium"
              >
                {[3, 4, 6, 8, 10, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} months (₹{Math.round(amount / m)}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium">Community Guarantor</label>
              <select
                value={guarantorId}
                onChange={(e) => setGuarantorId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-medium"
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
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
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
                <span className="font-semibold text-emerald-600">₹0.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Processing fee:</span>
                <span className="font-semibold text-emerald-600">{attemptFee ? '₹500 (PROHIBITED)' : '₹0.00'}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium text-foreground">
                <span>Total repayable:</span>
                <span className="text-sm font-semibold text-primary">
                  <Money amount={amount + (attemptFee ? 500 : 0)} />
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Anti-Riba Tester */}
          <div className="rounded-xl border border-dashed p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={attemptFee}
                onChange={(e) => setAttemptFee(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-rose-600"
              />
              <div className="text-[11px]">
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  Demo Test: Try adding a ₹500 "processing fee"
                </span>
                <p className="mt-0.5 text-muted-foreground">
                  Observe how the system blocks submission to protect Shariah compliance.
                </p>
              </div>
            </label>
            {attemptFee && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-500/10 p-2 text-[10px] text-rose-600 dark:text-rose-400">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Error: Any fee benefiting the lender converts the loan into Riba.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || attemptFee} className="gap-2">
              <HandCoins size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit Loan Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const { user } = useDemo();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(15000);
  const [type, setType] = useState<'Regular' | 'Voluntary'>('Regular');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Wallet size={22} />
            <h2 className="font-display text-xl">Contribute to the Pool</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium">Contribution Type</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Regular')}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  type === 'Regular' ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-secondary'
                }`}
              >
                <p className="text-xs font-semibold">Regular Pool</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Monthly community fund</p>
              </button>
              <button
                type="button"
                onClick={() => setType('Voluntary')}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  type === 'Voluntary' ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-secondary'
                }`}
              >
                <p className="text-xs font-semibold">Sadaqah Jariyah</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Voluntary gift to pool</p>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Amount (₹)</label>
            <Input
              type="number"
              min={100}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1.5 h-10 text-sm font-semibold"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    amount === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-secondary/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Barakah in community care:</span> 100% of your
            contribution directly strengthens the emergency lending pool for families in need.
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Wallet size={16} />
              {isSubmitting ? 'Confirming...' : 'Confirm Contribution'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LoanDetailModalProps {
  loan: Loan | null;
  onClose: () => void;
  borrowerName: string;
  guarantorName?: string;
}

export function LoanDetailModal({ loan, onClose, borrowerName, guarantorName }: LoanDetailModalProps) {
  const { user, role } = useDemo();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState<string | null>(null);

  if (!loan) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">{loan.id}</span>
            <h2 className="font-display text-xl">{borrowerName}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-secondary/30 p-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Principal</p>
              <p className="mt-1 font-semibold"><Money amount={loan.amount} /></p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Repaid</p>
              <p className="mt-1 font-semibold text-primary"><Money amount={loan.repaid} /></p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Remaining</p>
              <p className="mt-1 font-semibold text-foreground"><Money amount={remaining} /></p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Purpose</span>
              <span className="font-medium">{loan.purpose}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Guarantor</span>
              <span className="font-medium">{guarantorName || 'Assigned Member'}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Term</span>
              <span className="font-medium">{loan.months} months (₹{monthly}/month)</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Interest / Fees</span>
              <span className="font-medium text-emerald-600">₹0.00 (Riba-free)</span>
            </div>
          </div>

          {loan.status === 'Active' && (
            <div className="pt-2">
              <Button
                onClick={handlePayInstallment}
                disabled={paying === loan.id || remaining <= 0}
                className="w-full gap-2"
              >
                <RotateCcw size={15} />
                {paying === loan.id ? 'Recording payment...' : `Pay Next Monthly Installment (₹${monthly})`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoTourModal({ isOpen, onClose }: DemoTourModalProps) {
  const { switchRole, role } = useDemo();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [executing, setExecuting] = useState(false);

  if (!isOpen) return null;

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
          purpose: 'Mother’s urgent surgery',
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

  const current = tourSteps[step - 1];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={20} className="text-gold" />
            <h2 className="font-display text-xl">5-Minute Live Demo Tour</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tour">
            <X size={18} />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary">
              Step {step} of {tourSteps.length}
            </span>
            <span className="text-xs text-muted-foreground">Actor: {current.actor}</span>
          </div>

          <h3 className="font-display text-lg">{current.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{current.desc}</p>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={16} />
              <span>Storyline Progress</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Clicking below will execute this step automatically and update the database & ledger in real time.
            </p>
          </div>

          <div className="flex justify-between pt-3">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || executing}>
              Previous
            </Button>
            <Button onClick={handleNext} disabled={executing} className="gap-2">
              {executing ? 'Executing...' : current.actionLabel}
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
