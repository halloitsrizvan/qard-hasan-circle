import type { Circle, User, Membership, Overview } from '@/lib/types';
import {
  fetchCircleFromDB,
  fetchMembersFromDB,
  fetchOverviewFromDB,
  seedFirestore,
  joinCircleInDB,
  approveMembershipInDB
} from './firestoreAdapter';

export interface CircleService {
  getActive(): Promise<Circle>;
  getMembers(): Promise<{ user: User; membership: Membership }[]>;
  getOverview(): Promise<Overview>;
  seedDB(force?: boolean): Promise<{ success: boolean; message: string }>;
  join(data: { name: string; email: string; phone?: string; address?: string; note?: string }): Promise<{ user: User; membership: Membership }>;
  approveMembership(membershipId: string): Promise<Membership>;
}

export const circleService: CircleService = {
  async getActive(): Promise<Circle> {
    return fetchCircleFromDB();
  },

  async getMembers(): Promise<{ user: User; membership: Membership }[]> {
    return fetchMembersFromDB();
  },

  async getOverview(): Promise<Overview> {
    return fetchOverviewFromDB();
  },

  async seedDB(force = false) {
    return seedFirestore(force);
  },

  async join(data) {
    return joinCircleInDB(data);
  },

  async approveMembership(membershipId) {
    return approveMembershipInDB(membershipId);
  }
};
