export type Role = 'Super Admin' | 'Committee Admin' | 'Member' | 'Guarantor' | 'Auditor';
export type Status = 'Active' | 'Pending' | 'Requested' | 'Guarantor pending' | 'Closed' | 'Overdue' | 'Waived' | 'Paid' | 'Due';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  circleId?: string | undefined;
  joinedAt?: string | undefined;
  status?: 'Active' | 'Pending' | 'Suspended' | undefined;
  phone?: string | undefined;
  monthlyCommitment?: number | undefined;
}
export interface Membership {
  id: string;
  userId: string;
  circleId: string;
  status: 'Active' | 'Pending';
  joinedAt: string;
  monthlyCommitment?: number | undefined;
}
export interface Circle {
  id: string;
  name: string;
  mosque: string;
  location: string;
  balance: number;
  memberCount: number;
  maxLoan: number;
  maxMonths: number;
  minContribution: number;
  totalContributed?: number | undefined;
  totalLentOut?: number | undefined;
  totalRepaid?: number | undefined;
  createdAt?: string | undefined;
  adminName?: string | undefined;
  adminEmail?: string | undefined;
  status?: 'Active' | 'Pending' | undefined;
}
export interface SuperAdminStats {
  totalMahalls: number;
  totalMembers: number;
  totalContributedOverall: number;
  totalLentOutOverall: number;
  totalRepaidOverall: number;
  totalTreasuryBalance: number;
  repaymentRateOverall: number;
  activeLoansCount: number;
}
export interface Contribution { id: string; userId: string; circleId?: string | undefined; amount: number; date: string; type: 'Regular' | 'Voluntary'; status: 'Paid' | 'Pending' }
export interface Loan {
  id: string;
  userId: string;
  circleId?: string | undefined;
  amount: number;
  purpose: string;
  status: Status;
  repaid: number;
  months: number;
  date: string;
  guarantorId: string;
  isSelfCovered?: boolean | undefined;
  eligibilityNote?: string | undefined;
}
export interface Installment { id: string; loanId: string; circleId?: string | undefined; amount: number; dueDate: string; status: 'Paid' | 'Due' | 'Overdue' | 'Waived' }
export interface LedgerEntry { id: string; circleId?: string | undefined; date: string; type: 'Contribution' | 'Disbursement' | 'Repayment'; description: string; amount: number; balance: number; hash: string; previousHash: string }
export interface TrendPoint { month: string; contributions: number; loans: number }
export interface Overview { contributed: number; lentOut: number; repaid: number; available: number; availableToLend?: number | undefined; repaymentRate: number; trend: TrendPoint[] }

export interface PoolSplitConfig {
  emergencyRatio: number; // e.g. 70
  wealthRatio: number;    // e.g. 30
  updatedAt: string;
  updatedBy: string;
}

export interface ChitRound {
  id: string;
  roundNumber: number;
  month: string;
  potAmount: number;
  mode: 'Auction' | 'Lucky Draw';
  status: 'Completed' | 'Active' | 'Upcoming';
  winnerId?: string | undefined;
  winnerName?: string | undefined;
  discountBid?: number | undefined;
  payoutAmount?: number | undefined;
  dividendPerMember?: number | undefined;
  entropyHash?: string | undefined;
  drawDate?: string | undefined;
  participantsCount: number;
}

export interface MemberWealthShare {
  userId: string;
  userName: string;
  totalContributed: number;
  emergencyShare: number;
  wealthShare: number;
  emergencySharePercent: number;
  dividendEarned: number;
  hasWonPot: boolean;
  wonRound?: number | undefined;
  monthlyCommitment?: number | undefined;
}

export interface WealthOverview {
  totalContributed: number;
  emergencyPool: number;
  wealthPool: number;
  totalWealthAllocated?: number | undefined;
  totalChitDisbursed?: number | undefined;
  emergencyRatio: number;
  wealthRatio: number;
  activeRound: number;
  totalRounds: number;
  totalDividendsDistributed: number;
  chitRounds: ChitRound[];
  memberShares: MemberWealthShare[];
  potPerRound: number;
}

