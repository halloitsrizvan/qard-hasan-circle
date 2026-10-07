import { authService, type AuthService } from './authService';
import { circleService, type CircleService } from './circleService';
import { contributionService, type ContributionService } from './contributionService';
import { loanService, type LoanService } from './loanService';
import { ledgerService, type LedgerService } from './ledgerService';
import { wealthService, type WealthService } from './wealthService';
import { seedFirestore } from './firestoreAdapter';

export { authService, circleService, contributionService, loanService, ledgerService, wealthService, seedFirestore };
export type { AuthService, CircleService, ContributionService, LoanService, LedgerService, WealthService };

export const circleQueries = {
  overview: {
    queryKey: ['overview'],
    queryFn: () => circleService.getOverview()
  },
  loans: {
    queryKey: ['loans'],
    queryFn: () => loanService.list()
  },
  ledger: {
    queryKey: ['ledger'],
    queryFn: () => ledgerService.list()
  },
  members: {
    queryKey: ['members'],
    queryFn: () => circleService.getMembers()
  },
  contributions: {
    queryKey: ['contributions'],
    queryFn: () => contributionService.list()
  },
  wealth: {
    queryKey: ['wealth'],
    queryFn: () => wealthService.getOverview()
  },
  allCircles: {
    queryKey: ['allCircles'],
    queryFn: () => circleService.getAllCircles()
  },
  allUsersWithMahallu: {
    queryKey: ['allUsersWithMahallu'],
    queryFn: () => circleService.getAllUsersWithMahallu()
  },
  superAdminStats: {
    queryKey: ['superAdminStats'],
    queryFn: () => circleService.getSuperAdminStats()
  }
};
