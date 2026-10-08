import type { LedgerEntry } from '@/lib/types';
import { fetchLedgerFromDB, verifyLedgerInDB } from './firestoreAdapter';

export interface LedgerService {
  list(circleId?: string): Promise<LedgerEntry[]>;
  verify(circleId?: string): Promise<boolean>;
}

export const ledgerService: LedgerService = {
  async list(circleId?: string): Promise<LedgerEntry[]> {
    return fetchLedgerFromDB(circleId);
  },

  async verify(circleId?: string): Promise<boolean> {
    return verifyLedgerInDB(circleId);
  }
};
