import type { Loan, Installment } from '@/lib/types';
import {
  fetchLoansFromDB,
  fetchInstallmentsFromDB,
  requestLoanInDB,
  guaranteeLoanInDB,
  approveAndDisburseLoanInDB,
  rejectLoanInDB,
  payInstallmentInDB,
  rescheduleLoanInDB,
  waiveLoanInDB
} from './firestoreAdapter';

export interface LoanService {
  list(): Promise<Loan[]>;
  getInstallments(id: string): Promise<Installment[]>;
  request(params: {
    userId: string;
    amount: number;
    purpose: string;
    months: number;
    guarantorId: string;
  }): Promise<Loan>;
  guarantee(loanId: string, guarantorId: string): Promise<Loan>;
  approveAndDisburse(loanId: string): Promise<Loan>;
  reject(loanId: string, reason: string): Promise<Loan>;
  payInstallment(installmentId: string, loanId: string): Promise<Installment>;
  reschedule(loanId: string, newMonths: number, reason: string): Promise<Loan>;
  waive(loanId: string, reason: string): Promise<Loan>;
}

export const loanService: LoanService = {
  async list(): Promise<Loan[]> {
    return fetchLoansFromDB();
  },

  async getInstallments(id: string): Promise<Installment[]> {
    return fetchInstallmentsFromDB(id);
  },

  async request(params) {
    return requestLoanInDB(params);
  },

  async guarantee(loanId, guarantorId) {
    return guaranteeLoanInDB(loanId, guarantorId);
  },

  async approveAndDisburse(loanId) {
    return approveAndDisburseLoanInDB(loanId);
  },

  async reject(loanId, reason) {
    return rejectLoanInDB(loanId, reason);
  },

  async payInstallment(installmentId, loanId) {
    return payInstallmentInDB(installmentId, loanId);
  },

  async reschedule(loanId, newMonths, reason) {
    return rescheduleLoanInDB(loanId, newMonths, reason);
  },

  async waive(loanId, reason) {
    return waiveLoanInDB(loanId, reason);
  }
};
