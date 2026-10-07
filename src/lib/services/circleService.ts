import type { Circle, User, Membership, Overview, Role, SuperAdminStats } from '@/lib/types';
import {
  fetchCircleFromDB,
  fetchMembersFromDB,
  fetchOverviewFromDB,
  seedFirestore,
  joinCircleInDB,
  approveMembershipInDB,
  updateUserRoleInDB,
  updateMembershipStatusInDB,
  fetchAllCirclesFromDB,
  fetchCircleByIdFromDB,
  createCircleInDB,
  updateCircleInDB,
  fetchAllUsersWithMahalluFromDB,
  createUserAndAssignToMahalluInDB,
  reassignUserRoleAndMahalluInDB,
  deleteUserInDB,
  fetchSuperAdminStatsFromDB
} from './firestoreAdapter';

export interface CircleService {
  getActive(): Promise<Circle>;
  getMembers(): Promise<{ user: User; membership: Membership }[]>;
  getOverview(): Promise<Overview>;
  seedDB(force?: boolean): Promise<{ success: boolean; message: string }>;
  join(data: { name: string; email: string; phone?: string; address?: string; note?: string }): Promise<{ user: User; membership: Membership }>;
  approveMembership(membershipId: string): Promise<Membership>;
  updateUserRole(userId: string, newRole: Role): Promise<User>;
  updateMembershipStatus(membershipId: string, status: 'Active' | 'Pending'): Promise<Membership>;
  getAllCircles(): Promise<Circle[]>;
  getCircleById(id: string): Promise<Circle>;
  createMahall(data: {
    name: string;
    mosque: string;
    location: string;
    balance?: number | undefined;
    minContribution?: number | undefined;
    maxLoan?: number | undefined;
    maxMonths?: number | undefined;
    adminName?: string | undefined;
    adminEmail?: string | undefined;
  }): Promise<Circle>;
  updateMahall(id: string, updates: Partial<Circle>): Promise<Circle>;
  getAllUsersWithMahallu(): Promise<{ user: User; circle?: Circle | undefined; membership?: Membership | undefined }[]>;
  createUserUnderMahall(data: {
    name: string;
    email: string;
    role: Role;
    circleId: string;
    phone?: string | undefined;
  }): Promise<{ user: User; membership: Membership }>;
  reassignUserRoleAndMahall(userId: string, role: Role, circleId: string): Promise<{ user: User; membership: Membership }>;
  deleteUser(userId: string): Promise<{ success: boolean }>;
  getSuperAdminStats(): Promise<SuperAdminStats>;
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
  },

  async updateUserRole(userId: string, newRole: Role) {
    return updateUserRoleInDB(userId, newRole);
  },

  async updateMembershipStatus(membershipId: string, status: 'Active' | 'Pending') {
    return updateMembershipStatusInDB(membershipId, status);
  },

  async getAllCircles(): Promise<Circle[]> {
    return fetchAllCirclesFromDB();
  },

  async getCircleById(id: string): Promise<Circle> {
    return fetchCircleByIdFromDB(id);
  },

  async createMahall(data): Promise<Circle> {
    return createCircleInDB(data);
  },

  async updateMahall(id: string, updates: Partial<Circle>): Promise<Circle> {
    return updateCircleInDB(id, updates);
  },

  async getAllUsersWithMahallu(): Promise<{ user: User; circle?: Circle | undefined; membership?: Membership | undefined }[]> {
    return fetchAllUsersWithMahalluFromDB();
  },

  async createUserUnderMahall(data): Promise<{ user: User; membership: Membership }> {
    return createUserAndAssignToMahalluInDB(data);
  },

  async reassignUserRoleAndMahall(userId: string, role: Role, circleId: string): Promise<{ user: User; membership: Membership }> {
    return reassignUserRoleAndMahalluInDB(userId, role, circleId);
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    return deleteUserInDB(userId);
  },

  async getSuperAdminStats(): Promise<SuperAdminStats> {
    return fetchSuperAdminStatsFromDB();
  }
};
