import type { Circle, User, Membership, Contribution, Loan, Installment, LedgerEntry, Overview } from '@/lib/types';

export const circle: Circle = {
  id: 'mahallu',
  name: 'Mahallu Qard Hasan Circle',
  mosque: 'Perinthalmanna Juma Masjid',
  location: 'Perinthalmanna, Malappuram, Kerala',
  balance: 0,
  memberCount: 0,
  maxLoan: 50000,
  maxMonths: 12,
  minContribution: 3000,
  totalContributed: 0,
  totalLentOut: 0,
  totalRepaid: 0,
  createdAt: '2026-01-01',
  status: 'Active'
};

export const users: User[] = [];

export const memberships: Membership[] = [];

export const contributions: Contribution[] = [];

export const loans: Loan[] = [];

export const installments: Installment[] = [];

// Deterministic demo chain fingerprints
export function fingerprint(value: string): string {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}

export const ledger: LedgerEntry[] = [];

export const overview: Overview = {
  contributed: 0,
  lentOut: 0,
  repaid: 0,
  available: 0,
  repaymentRate: 100,
  trend: [
    { month: 'Nov', contributions: 0, loans: 0 },
    { month: 'Dec', contributions: 0, loans: 0 },
    { month: 'Jan', contributions: 0, loans: 0 },
    { month: 'Feb', contributions: 0, loans: 0 },
    { month: 'Mar', contributions: 0, loans: 0 },
    { month: 'Apr', contributions: 0, loans: 0 },
    { month: 'May', contributions: 0, loans: 0 },
    { month: 'Jun', contributions: 0, loans: 0 },
    { month: 'Jul', contributions: 0, loans: 0 },
    { month: 'Aug', contributions: 0, loans: 0 },
    { month: 'Sep', contributions: 0, loans: 0 },
    { month: 'Oct', contributions: 0, loans: 0 }
  ]
};
