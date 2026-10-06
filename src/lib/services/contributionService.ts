import type { Contribution } from '@/lib/types';
import {
  fetchContributionsFromDB,
  addContributionToDB,
  confirmContributionInDB
} from './firestoreAdapter';

export interface ContributionService {
  list(): Promise<Contribution[]>;
  create(contribution: Omit<Contribution, 'id'>): Promise<Contribution>;
  confirm(contributionId: string): Promise<Contribution>;
}

export const contributionService: ContributionService = {
  async list(): Promise<Contribution[]> {
    return fetchContributionsFromDB();
  },

  async create(contribution: Omit<Contribution, 'id'>): Promise<Contribution> {
    return addContributionToDB(contribution);
  },

  async confirm(contributionId: string): Promise<Contribution> {
    return confirmContributionInDB(contributionId);
  }
};
