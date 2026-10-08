import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Coins,
  BadgePercent,
  Lock,
  Calendar,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money } from '@/components/shared';
import { loanService, contributionService, circleQueries } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import type { Loan, User, Membership, Contribution } from '@/lib/types';
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
  const { user, circle } = useDemo();
  const queryClient = useQueryClient();
  const mounted = useModalHelper(isOpen, onClose);

  const { data: overviewData } = useQuery({
    ...circleQueries.overview,
    enabled: isOpen
  });

  const { data: wealthData } = useQuery({
    ...circleQueries.wealth,
    enabled: isOpen
  });

  // Available to lend is the 70% emergency liquidity pool available in the circle
  const availableToLend =
    overviewData?.availableToLend ??
    wealthData?.emergencyPool ??
    availableBalance ??
    (circle?.balance ? Math.round(circle.balance * 0.7) : 50000);

  // The effective loan ceiling is capped by BOTH the circle's maxLoan policy and the actual Available to Lend liquidity
  const effectiveMaxLoan = Math.max(0, Math.min(maxLoan, availableToLend));
  const minLoan = effectiveMaxLoan >= 1000 ? 1000 : (effectiveMaxLoan > 0 ? 100 : 0);

  // Calculate user's emergency stake & percentage from wealth data
  const myWealth = wealthData?.memberShares?.find((m) => m.userId === user?.id);
  const emergencyStake = myWealth?.emergencyShare ?? (user?.monthlyCommitment ? Math.round(user.monthlyCommitment * 0.7 * 12) : 10000);
  const emergencyPercent = myWealth?.emergencySharePercent ?? 10;

  // Strictly filter only members with 'Guarantor' role in the current active Mahallu circle (excluding borrower himself)
  const eligibleGuarantors = members.filter((m) => {
    if (m.user.id === user?.id) return false;
    if (m.user.role !== 'Guarantor') return false;
    const currentCircleId = circle?.id || 'mahallu';
    const memberCircleId = m.membership?.circleId || m.user?.circleId || 'mahallu';
    return memberCircleId === currentCircleId;
  });

  const [amount, setAmount] = useState(() => (effectiveMaxLoan > 0 ? Math.min(10000, effectiveMaxLoan) : 0));
  const [purpose, setPurpose] = useState('Essential household emergency');
  const [months, setMonths] = useState(6);
  const [guarantorId, setGuarantorId] = useState(eligibleGuarantors[0]?.user.id || '');
  const [attemptFee, setAttemptFee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSelfCovered = emergencyStake > 0 && amount > 0 && amount <= emergencyStake;

  // Sync and clamp amount whenever effectiveMaxLoan or minLoan updates
  useEffect(() => {
    if (effectiveMaxLoan > 0) {
      setAmount((prev) => {
        if (prev > effectiveMaxLoan) return effectiveMaxLoan;
        if (prev < minLoan && minLoan > 0) return minLoan;
        if (prev === 0 && minLoan > 0) return minLoan;
        return prev;
      });
    } else {
      setAmount(0);
    }
  }, [effectiveMaxLoan, minLoan]);

  // Sync guarantorId when eligibleGuarantors changes
  useEffect(() => {
    if (eligibleGuarantors.length > 0 && (!guarantorId || !eligibleGuarantors.some((g) => g.user.id === guarantorId))) {
      setGuarantorId(eligibleGuarantors[0]?.user.id || '');
    }
  }, [eligibleGuarantors, guarantorId]);

  if (!isOpen || !mounted) return null;

  const purposeOptions = [
    'Mother’s surgery (Medical emergency)',
    'Children’s higher education tuition',
    'Small business equipment support',
    'Urgent family home repairs',
    'Essential household emergency',
    'General personal / family need'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (attemptFee) {
      toast.error('Violation: Riba and processing fees are strictly forbidden in Qard Hasan.', {
        description: 'Total repayable must equal principal alone. No fees permitted.'
      });
      return;
    }

    if (effectiveMaxLoan <= 0 || amount <= 0) {
      toast.error('No emergency reserve funds currently available to lend.');
      return;
    }

    if (amount > effectiveMaxLoan) {
      toast.error(`Requested loan amount (₹${amount.toLocaleString('en-IN')}) exceeds available funds to lend (₹${effectiveMaxLoan.toLocaleString('en-IN')}).`, {
        description: `Max loan is restricted to available emergency lending liquidity (₹${availableToLend.toLocaleString('en-IN')}) and circle policy cap (₹${maxLoan.toLocaleString('en-IN')}).`
      });
      return;
    }

    if (!isSelfCovered && !guarantorId && eligibleGuarantors.length > 0) {
      toast.error('Please select a community guarantor from your Mahallu for loans exceeding your emergency stake.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loanService.request({
        userId: user?.id || 'u2',
        amount,
        purpose,
        months,
        guarantorId: isSelfCovered ? (guarantorId || user?.id || 'self') : (guarantorId || eligibleGuarantors[0]?.user.id || 'u4'),
        circleId: circle?.id || 'mahallu'
      });
      toast.success(
        isSelfCovered
          ? 'Fast-Track Loan Request Submitted (Self-Covered by Emergency Stake)!'
          : 'Loan request submitted successfully!',
        {
          description: isSelfCovered
            ? `Your ₹${amount.toLocaleString('en-IN')} request is within your emergency stake (₹${emergencyStake.toLocaleString('en-IN')}). Fast-track approved!`
            : `Guarantor notification sent to Mahallu member (${circle?.mosque || 'Active Mahall'}).`
        }
      );
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
              <p className="text-[11px] text-muted-foreground">
                {circle?.mosque || 'Mahallu Qard Hasan Circle'} · Zero interest, 100% principal
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="size-8 rounded-lg hover:bg-muted">
            <X size={18} />
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <form id="loan-request-form" onSubmit={handleSubmit} className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
          {/* Emergency Fund Stake Banner */}
          <div className={`rounded-2xl border p-3.5 transition-all ${
            isSelfCovered
              ? 'border-emerald-500/40 bg-emerald-500/10 text-foreground shadow-sm'
              : 'border-border bg-muted/30 text-muted-foreground'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <BadgePercent size={16} className={isSelfCovered ? 'text-emerald-500' : 'text-primary'} />
                <span>Your Emergency Fund Stake:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ₹{emergencyStake.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">({emergencyPercent}% of E-Fund)</span>
              </span>
             
            </div>
            {isSelfCovered ? (
              <p className="mt-1.5 text-[11px] text-emerald-800 dark:text-emerald-200 leading-tight">
                ✨ <strong>Self-Covered Privilege:</strong> Your loan (₹{amount.toLocaleString('en-IN')}) is within your emergency equity stake. Eligible for immediate fast-track approval even for ordinary personal/family needs without mandatory external guarantor.
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Requests up to your stake (₹{emergencyStake.toLocaleString('en-IN')}) qualify for fast-track self-covered lending. Higher amounts require a Mahallu guarantor.
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-baseline text-xs font-medium">
              <span className="text-foreground font-semibold">Loan Amount</span>
              <div className="text-right">
                <span className="font-semibold text-primary">
                  <Money amount={amount} />
                </span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">
                  (Available to Lend: <Money amount={effectiveMaxLoan} /> · Policy Cap: <Money amount={maxLoan} />)
                </span>
              </div>
            </div>
            <input
              type="range"
              min={minLoan}
              max={effectiveMaxLoan || 1000}
              step={effectiveMaxLoan >= 1000 ? 1000 : 100}
              value={effectiveMaxLoan > 0 ? Math.min(amount, effectiveMaxLoan) : 0}
              disabled={effectiveMaxLoan <= 0}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer rounded-lg bg-secondary accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>₹{minLoan.toLocaleString('en-IN')}</span>
              {emergencyStake > 0 && emergencyStake < effectiveMaxLoan && (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{emergencyStake.toLocaleString('en-IN')} (Stake)</span>
              )}
              <span className="font-semibold text-primary">Max Available: ₹{effectiveMaxLoan.toLocaleString('en-IN')}</span>
            </div>
            {effectiveMaxLoan < maxLoan && (
              <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertTriangle size={12} className="shrink-0" />
                <span>
                  Loan amount is restricted under <strong>Available to Lend (₹{effectiveMaxLoan.toLocaleString('en-IN')})</strong> based on current emergency pool liquidity.
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Purpose of Loan</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Repayment Term</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {[1, 2, 3, 4, 6, 8, 10, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? 'month' : 'months'} (₹{Math.round(amount / m).toLocaleString('en-IN')}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Community Guarantor</label>
                {isSelfCovered && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    (Self-Covered)
                  </span>
                )}
              </div>
              {eligibleGuarantors.length > 0 ? (
                <select
                  value={guarantorId}
                  onChange={(e) => setGuarantorId(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {isSelfCovered && (
                    <option value="">✨ None (Self-Backed by Emergency Stake)</option>
                  )}
                  {eligibleGuarantors.map((g) => (
                    <option key={g.user.id} value={g.user.id}>
                      {g.user.name} ({g.user.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1.5 rounded-xl border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                  {isSelfCovered ? 'Self-backed with personal emergency stake' : 'No other members registered under this Mahall.'}
                </div>
              )}
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
          <Button
            form="loan-request-form"
            type="submit"
            disabled={isSubmitting || attemptFee || effectiveMaxLoan <= 0 || amount <= 0}
            className="gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50"
          >
            <HandCoins size={16} />
            {isSubmitting ? 'Submitting...' : isSelfCovered ? 'Submit Self-Covered Loan' : 'Submit Loan Request'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const { user, circle } = useDemo();
  const queryClient = useQueryClient();
  const mounted = useModalHelper(isOpen, onClose);

  const { data: contributions = [] } = useQuery(circleQueries.contributions);
  const { data: members = [] } = useQuery(circleQueries.members);
  const { data: ledger = [] } = useQuery(circleQueries.ledger);

  const assignedMonthly = user?.monthlyCommitment ?? circle?.minContribution ?? 1000;
  const [amount, setAmount] = useState(assignedMonthly);
  const [type, setType] = useState<'Regular' | 'Voluntary'>('Regular');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = 2026;
  const systemCurrentMonthIdx = 9; // October (0-indexed)

  const userMembership = useMemo(() => {
    if (!user) return null;
    const normalizedEmail = (user.email || '').trim().toLowerCase();
    const normalizedName = (user.name || '').trim().toLowerCase();
    return members.find(
      (m) =>
        m.user.id === user.id ||
        (user.email && m.user.email?.toLowerCase() === normalizedEmail) ||
        (user.name && m.user.name?.toLowerCase() === normalizedName)
    );
  }, [members, user]);

  const joinedAtStr = user?.joinedAt || userMembership?.membership?.joinedAt || userMembership?.user?.joinedAt;

  const joinMonthIdx = useMemo(() => {
    if (!joinedAtStr) return 0;
    try {
      const d = new Date(joinedAtStr);
      if (!isNaN(d.getTime())) {
        if (d.getFullYear() < currentYear) return 0;
        if (d.getFullYear() > currentYear) return 12;
        return d.getMonth();
      }
    } catch {}
    return 0;
  }, [joinedAtStr, currentYear]);

  // Set of paid month keys for this user: "2026-9"
  const paidMonthsMap = useMemo(() => {
    const map = new Map<string, Contribution>();
    if (!user) return map;

    const normalizedUserEmail = (user.email || '').trim().toLowerCase();
    const normalizedUserName = (user.name || '').trim().toLowerCase();
    const memberId = userMembership?.user?.id;
    const memberEmail = userMembership?.user?.email?.toLowerCase();
    const memberName = userMembership?.user?.name?.toLowerCase();

    // Helper to check if a record belongs to this user
    const isUserMatch = (recordUserId?: string) => {
      if (!recordUserId) return false;
      if (recordUserId === user.id) return true;
      if (memberId && recordUserId === memberId) return true;
      if (normalizedUserEmail && recordUserId.toLowerCase() === normalizedUserEmail) return true;
      if (memberEmail && recordUserId.toLowerCase() === memberEmail) return true;

      // Check against matching member in circle members list
      const matched = members.find((m) => m.user.id === recordUserId)?.user;
      if (matched) {
        if (normalizedUserEmail && matched.email?.toLowerCase() === normalizedUserEmail) return true;
        if (normalizedUserName && matched.name?.toLowerCase() === normalizedUserName) return true;
      }
      return false;
    };

    // 1. Check explicit Contributions table
    contributions.forEach((c) => {
      if (c.status === 'Paid' && c.type !== 'Voluntary' && isUserMatch(c.userId)) {
        const d = new Date(c.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          map.set(key, c);
        }
      }
    });

    // 2. Check Ledger entries (e.g., LE-mahallu-001 "Abdul Kareem · regular pool contribution")
    ledger.forEach((e) => {
      if (e.type === 'Contribution') {
        const desc = e.description.toLowerCase();
        const matchesName = (normalizedUserName && desc.includes(normalizedUserName)) || (memberName && desc.includes(memberName));
        const matchesEmail = (normalizedUserEmail && desc.includes(normalizedUserEmail)) || (memberEmail && desc.includes(memberEmail));

        if ((matchesName || matchesEmail) && !desc.includes('voluntary') && !desc.includes('sadaqah')) {
          const d = new Date(e.date);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!map.has(key)) {
              map.set(key, {
                id: e.id,
                userId: user.id,
                amount: e.amount,
                date: e.date,
                type: 'Regular',
                status: 'Paid',
                circleId: e.circleId
              });
            }
          }
        }
      }
    });

    return map;
  }, [contributions, ledger, members, user, userMembership]);

  // Unpaid months ONLY (Paid months and months prior to join date are hidden)
  const unpaidMonths = useMemo(() => {
    const list: {
      monthIdx: number;
      year: number;
      key: string;
      label: string;
      shortLabel: string;
      statusTag: 'Current Due' | 'Pending' | 'Upcoming' | 'Advance';
    }[] = [];

    // Current year (2026) starting from join month index
    for (let m = joinMonthIdx; m < 12; m++) {
      const key = `${currentYear}-${m}`;
      if (!paidMonthsMap.has(key)) {
        let statusTag: 'Current Due' | 'Pending' | 'Upcoming' = 'Upcoming';
        if (m === systemCurrentMonthIdx) statusTag = 'Current Due';
        else if (m < systemCurrentMonthIdx) statusTag = 'Pending';
        else statusTag = 'Upcoming';

        list.push({
          monthIdx: m,
          year: currentYear,
          key,
          label: `${FULL_MONTH_NAMES[m]} ${currentYear}`,
          shortLabel: `${MONTH_NAMES[m]} '${String(currentYear).slice(2)}`,
          statusTag
        });
      }
    }

    // If all months in 2026 are paid, show early 2027 advance months
    if (list.length === 0) {
      for (let m = 0; m < 6; m++) {
        const key = `${currentYear + 1}-${m}`;
        if (!paidMonthsMap.has(key)) {
          list.push({
            monthIdx: m,
            year: currentYear + 1,
            key,
            label: `${FULL_MONTH_NAMES[m]} ${currentYear + 1}`,
            shortLabel: `${MONTH_NAMES[m]} '${String(currentYear + 1).slice(2)}`,
            statusTag: 'Advance'
          });
        }
      }
    }

    return list;
  }, [joinMonthIdx, paidMonthsMap, currentYear, systemCurrentMonthIdx]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');

  useEffect(() => {
    if (unpaidMonths.length > 0) {
      // Pick current month if available, else first unpaid month
      const currentDue = unpaidMonths.find((m) => m.monthIdx === systemCurrentMonthIdx && m.year === currentYear);
      if (currentDue && !unpaidMonths.some((m) => m.key === selectedMonthKey)) {
        setSelectedMonthKey(currentDue.key);
      } else if (!unpaidMonths.some((m) => m.key === selectedMonthKey)) {
        setSelectedMonthKey(unpaidMonths[0].key);
      }
    }
  }, [unpaidMonths, selectedMonthKey, systemCurrentMonthIdx, currentYear]);

  const paidCountInYear = useMemo(() => {
    let count = 0;
    for (let m = 0; m < 12; m++) {
      if (paidMonthsMap.has(`${currentYear}-${m}`)) count++;
    }
    return count;
  }, [paidMonthsMap, currentYear]);

  useEffect(() => {
    if (type === 'Regular') {
      setAmount(assignedMonthly);
    }
  }, [assignedMonthly, type]);

  if (!isOpen || !mounted) return null;

  const voluntaryPresets = [500, 1000, 2000, 5000, 10000, 25000];
  const effectiveAmount = type === 'Regular' ? assignedMonthly : amount;
  const selectedMonthObj = unpaidMonths.find((m) => m.key === selectedMonthKey) || unpaidMonths[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = type === 'Regular' ? assignedMonthly : amount;
    if (finalAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    let contributionDate = new Date().toISOString().slice(0, 10);
    let monthLabel = '';

    if (type === 'Regular') {
      if (!selectedMonthObj) {
        toast.error('No unpaid month available to contribute.');
        return;
      }
      contributionDate = new Date(selectedMonthObj.year, selectedMonthObj.monthIdx, 5).toISOString().slice(0, 10);
      monthLabel = selectedMonthObj.label;
    }

    setIsSubmitting(true);
    try {
      await contributionService.create({
        userId: user?.id || 'u2',
        amount: finalAmount,
        date: contributionDate,
        type,
        status: 'Paid',
        circleId: circle?.id || 'mahallu'
      });
      toast.success(
        type === 'Voluntary'
          ? `Donated ₹${finalAmount.toLocaleString('en-IN')} as Sadaqah Jariyah directly to Emergency Fund!`
          : `Contributed ₹${finalAmount.toLocaleString('en-IN')} for ${monthLabel}! (70% Emergency / 30% Chit Pot)`,
        {
          description: 'Reconciled & added to tamper-evident ledger.'
        }
      );
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
          {/* Member Monthly Commitment Info Box */}
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-primary" />
              <div>
                <p className="font-semibold text-foreground">Your Monthly Commitment</p>
                <p className="text-[10px] text-muted-foreground">Pre-configured under {circle?.mosque || 'Mahall'}</p>
              </div>
            </div>
            <span className="rounded-lg bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs font-bold text-primary">
              ₹{assignedMonthly.toLocaleString('en-IN')}/mo
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Select Contribution Type</label>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setType('Regular');
                  setAmount(assignedMonthly);
                }}
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
                <p className="mt-1 text-[10px] text-muted-foreground leading-tight">Fixed to ₹{assignedMonthly.toLocaleString('en-IN')} (70/30)</p>
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
                <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-tight">100% Emergency (Any Amount)</p>
                {type === 'Voluntary' && (
                  <div className="absolute top-2 right-2 size-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          </div>

          {/* Month Selector when contributing to Regular Pool */}
          {type === 'Regular' && (
            <div className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar size={14} className="text-primary" />
                  <span>Select Month to Pay</span>
                </label>
                {paidCountInYear > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CalendarCheck size={11} /> {paidCountInYear} paid (hidden)
                  </span>
                )}
              </div>

              {unpaidMonths.length === 0 ? (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center text-xs text-emerald-700 dark:text-emerald-300">
                  🎉 <strong>All Caught Up!</strong> All commitment months have already been fulfilled!
                </div>
              ) : (
                <>
                  <select
                    value={selectedMonthKey}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  >
                    {unpaidMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} — {m.statusTag} (₹{assignedMonthly.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>

                  {/* Quick Select Pill Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unpaidMonths.slice(0, 4).map((m) => {
                      const isSelected = (selectedMonthKey || unpaidMonths[0]?.key) === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedMonthKey(m.key)}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'border-border bg-card text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{m.shortLabel}</span>
                          {m.statusTag === 'Current Due' && (
                            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isSelected ? 'bg-primary-foreground text-primary' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}>
                              Due
                            </span>
                          )}
                          {m.statusTag === 'Pending' && (
                            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isSelected ? 'bg-primary-foreground text-primary' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                              Overdue
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Only pending and upcoming unpaid months are displayed. Already paid months are excluded automatically.
                  </p>
                </>
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-foreground">
              <label className="flex items-center gap-1.5">
                <span>Amount (₹)</span>
                {type === 'Regular' && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary flex items-center gap-1">
                    <Lock size={10} /> Fixed Monthly Commitment
                  </span>
                )}
                {type === 'Voluntary' && (
                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Flexible / Open Amount
                  </span>
                )}
              </label>
              <span className="text-primary font-bold font-mono">₹{effectiveAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="relative mt-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
              <Input
                type="number"
                min={100}
                step={100}
                value={type === 'Regular' ? assignedMonthly : amount}
                readOnly={type === 'Regular'}
                onChange={(e) => {
                  if (type === 'Voluntary') {
                    setAmount(Number(e.target.value));
                  }
                }}
                className={`h-11 rounded-xl border-input pl-8 text-base font-bold text-foreground font-mono ${
                  type === 'Regular'
                    ? 'bg-muted/60 cursor-not-allowed text-foreground/80'
                    : 'bg-background focus-visible:ring-1 focus-visible:ring-primary'
                }`}
              />
            </div>

            {type === 'Regular' ? (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Regular pool contributions are locked to your monthly commitment of <strong>₹{assignedMonthly.toLocaleString('en-IN')}</strong> for <strong>{selectedMonthObj?.label || 'selected month'}</strong>.
              </p>
            ) : (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-medium">Quick Donation Presets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {voluntaryPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        amount === p
                          ? 'border-amber-500 bg-amber-500 text-white shadow-sm font-semibold'
                          : 'border-border bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      ₹{p.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transparent Allocation Card */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px]">
              <Sparkles size={14} />
              <span>
                {type === 'Voluntary' ? '100% Direct Emergency Fund Routing' : 'Dual-Fund Partitioning (70% / 30%)'}
              </span>
            </div>
            {type === 'Voluntary' ? (
              <p className="text-[11px] text-muted-foreground">
                💚 <strong>Sadaqah Jariyah:</strong> 100% of this ₹{effectiveAmount.toLocaleString('en-IN')} donation goes directly into the <strong>Qard Emergency Lending Fund</strong> to assist struggling community families with zero-interest loans.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                🔄 <strong>Monthly Split:</strong> ₹{Math.round((assignedMonthly * 0.7)).toLocaleString('en-IN')} (70%) grows your emergency stake for mutual lending, and ₹{Math.round((assignedMonthly * 0.3)).toLocaleString('en-IN')} (30%) enters the monthly Chit pot.
              </p>
            )}
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
            disabled={isSubmitting || effectiveAmount <= 0 || (type === 'Regular' && unpaidMonths.length === 0)}
            className="gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 cursor-pointer"
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
        setStep((s: number) => s + 1);
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
            onClick={() => setStep((s: number) => Math.max(1, s - 1))}
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
