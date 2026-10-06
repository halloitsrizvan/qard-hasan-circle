import type { LedgerEntry } from '@/lib/types';
import { fetchLedgerFromDB, verifyLedgerInDB } from './firestoreAdapter';

export interface LedgerService {
  list(): Promise<LedgerEntry[]>;
  verify(): Promise<boolean>;
}

export const ledgerService: LedgerService = {
  async list(): Promise<LedgerEntry[]> {
    return fetchLedgerFromDB();
  },

  async verify(): Promise<boolean> {
    return verifyLedgerInDB();
  }
};
