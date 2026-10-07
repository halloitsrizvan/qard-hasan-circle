import type { ChitRound, MemberWealthShare, PoolSplitConfig, WealthOverview } from '../types';
import { users } from '../../data/seed';
import {
  fetchWealthSplitFromDB,
  updateWealthSplitInDB,
  fetchChitRoundsFromDB,
  saveChitRoundInDB,
  defaultSplitConfig,
  defaultChitRounds
} from './firestoreAdapter';

export const DEFAULT_SPLIT = defaultSplitConfig;
export const initialChitRounds = defaultChitRounds;

class WealthService {
  public async getSplitConfig(): Promise<PoolSplitConfig> {
    return fetchWealthSplitFromDB();
  }

  public async updateSplitConfig(emergencyRatio: number, wealthRatio: number, adminName = 'Committee Admin'): Promise<PoolSplitConfig> {
    const updated: PoolSplitConfig = {
      emergencyRatio,
      wealthRatio,
      updatedAt: new Date().toISOString().split('T')[0] ?? '2026-10-07',
      updatedBy: adminName
    };
    return updateWealthSplitInDB(updated);
  }

  public async getOverview(): Promise<WealthOverview> {
    const [split, rounds] = await Promise.all([
      fetchWealthSplitFromDB(),
      fetchChitRoundsFromDB()
    ]);

    const totalContributed = 210000;
    const emergencyPool = Math.round((totalContributed * split.emergencyRatio) / 100);
    const wealthPool = totalContributed - emergencyPool;

    const completedRounds = rounds.filter((r) => r.status === 'Completed');
    const totalDividendsDistributed = completedRounds.reduce((acc, r) => acc + (r.discountBid ?? 0), 0);

    const pastWinners = new Map(completedRounds.map((r) => [r.winnerId, r.roundNumber]));

    const memberShares: MemberWealthShare[] = users.map((u) => {
      const userContribution = 17500;
      const userEmergency = Math.round((userContribution * split.emergencyRatio) / 100);
      const userWealth = userContribution - userEmergency;
      const userDividend = completedRounds.reduce((sum, r) => sum + (r.dividendPerMember ?? 0), 0);
      const wonRound = pastWinners.get(u.id);

      return {
        userId: u.id,
        userName: u.name,
        totalContributed: userContribution,
        emergencyShare: userEmergency,
        wealthShare: userWealth,
        dividendEarned: userDividend,
        hasWonPot: !!wonRound,
        wonRound
      };
    });

    const activeRoundObj = rounds.find((r) => r.status === 'Active');
    const activeRoundNum = activeRoundObj ? activeRoundObj.roundNumber : 5;

    return {
      totalContributed,
      emergencyPool,
      wealthPool,
      emergencyRatio: split.emergencyRatio,
      wealthRatio: split.wealthRatio,
      activeRound: activeRoundNum,
      totalRounds: rounds.length || 12,
      totalDividendsDistributed,
      chitRounds: rounds,
      memberShares,
      potPerRound: 36000
    };
  }

  public async conductChitDraw(roundId: string, winnerId: string, winnerName: string, discountBid = 0): Promise<ChitRound> {
    const rounds = await fetchChitRoundsFromDB();
    const roundIdx = rounds.findIndex((r) => r.id === roundId);
    if (roundIdx === -1 || !rounds[roundIdx]) throw new Error('Round not found');

    const round = rounds[roundIdx]!;
    const payoutAmount = round.potAmount - discountBid;
    const dividendPerMember = Math.round(discountBid / round.participantsCount);

    const mockHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const updatedRound: ChitRound = {
      ...round,
      status: 'Completed',
      winnerId,
      winnerName,
      discountBid,
      payoutAmount,
      dividendPerMember,
      entropyHash: mockHash,
      drawDate: new Date().toISOString().split('T')[0]
    };

    await saveChitRoundInDB(updatedRound);

    const nextRoundRaw = rounds[roundIdx + 1];
    if (nextRoundRaw) {
      const nextRound: ChitRound = {
        ...nextRoundRaw,
        status: 'Active',
        drawDate: '2026-11-20'
      };
      await saveChitRoundInDB(nextRound);
    }

    return updatedRound;
  }
}

export const wealthService = new WealthService();
export type { WealthService };

