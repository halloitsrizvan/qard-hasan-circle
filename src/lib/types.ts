export type Role = 'Committee Admin' | 'Member' | 'Guarantor' | 'Auditor';
export type Status = 'Active' | 'Pending' | 'Requested' | 'Guarantor pending' | 'Closed' | 'Overdue' | 'Waived' | 'Paid' | 'Due';
export interface User { id: string; name: string; email: string; role: Role; initials: string }
export interface Membership { id: string; userId: string; circleId: string; status: 'Active' | 'Pending'; joinedAt: string }
export interface Circle { id: string; name: string; mosque: string; location: string; balance: number; memberCount: number; maxLoan: number; maxMonths: number; minContribution: number }
export interface Contribution { id: string; userId: string; amount: number; date: string; type: 'Regular' | 'Voluntary'; status: 'Paid' | 'Pending' }
export interface Loan { id: string; userId: string; amount: number; purpose: string; status: Status; repaid: number; months: number; date: string; guarantorId: string }
export interface Installment { id: string; loanId: string; amount: number; dueDate: string; status: 'Paid' | 'Due' | 'Overdue' | 'Waived' }
export interface LedgerEntry { id: string; date: string; type: 'Contribution' | 'Disbursement' | 'Repayment'; description: string; amount: number; balance: number; hash: string; previousHash: string }
export interface TrendPoint { month: string; contributions: number; loans: number }
export interface Overview { contributed: number; lentOut: number; repaid: number; available: number; repaymentRate: number; trend: TrendPoint[] }
