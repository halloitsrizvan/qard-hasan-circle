import type { ChitRound, MemberWealthShare, PoolSplitConfig, WealthOverview } from '../types';
import {
  fetchWealthSplitFromDB,
  updateWealthSplitInDB,
  fetchChitRoundsFromDB,
  saveChitRoundInDB,
  defaultSplitConfig,
  defaultChitRounds,
  fetchCircleFromDB,
  fetchMembersFromDB,
  fetchOverviewFromDB,
  fetchContributionsFromDB,
  fetchLedgerFromDB
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

  public async getOverview(circleId?: string): Promise<WealthOverview> {
    const [split, rounds, activeCircle, membersList, overview, contributions, ledger] = await Promise.all([
      fetchWealthSplitFromDB(),
      fetchChitRoundsFromDB(),
      fetchCircleFromDB(),
      fetchMembersFromDB(),
      fetchOverviewFromDB(circleId),
      fetchContributionsFromDB(circleId),
      fetchLedgerFromDB(circleId)
    ]);

    const paidContributions = contributions.filter((c) => c.status === 'Paid');
    const regularContributions = paidContributions.filter((c) => c.type !== 'Voluntary');
    const voluntaryContributions = paidContributions.filter((c) => c.type === 'Voluntary');

    const regularTotal = regularContributions.reduce((sum, c) => sum + c.amount, 0);
    const voluntaryTotal = voluntaryContributions.reduce((sum, c) => sum + c.amount, 0);

    // If no explicit contributions recorded yet, fallback to overview contributed
    const totalContributed = paidContributions.length > 0
      ? regularTotal + voluntaryTotal
      : overview.contributed;

    const baseRegularTotal = paidContributions.length > 0 ? regularTotal : totalContributed;
    const emergencyFromRegular = Math.round((baseRegularTotal * split.emergencyRatio) / 100);
    const emergencyPool = emergencyFromRegular + voluntaryTotal;

    const completedRounds = rounds.filter((r) => r.status === 'Completed');
    const totalDividendsDistributed = completedRounds.reduce((acc, r) => acc + (r.discountBid ?? 0), 0);

    const pastWinners = new Map(completedRounds.map((r) => [r.winnerId, r.roundNumber]));
    const memberCount = Math.max(membersList.length, 1);
    const fallbackPerMember = Math.round(totalContributed / memberCount);

    const memberShares: MemberWealthShare[] = membersList.map(({ user, membership }) => {
      const uName = (user.name || '').toLowerCase();
      const uId = (user.id || '').toLowerCase();
      const uEmail = (user.email || '').toLowerCase();

      const userPaidReg = regularContributions
        .filter((c) => {
          if (c.userId === user.id) return true;
          if (uEmail && c.userId.toLowerCase() === uEmail) return true;
          return false;
        })
        .reduce((sum, c) => sum + c.amount, 0);

      const userPaidVol = voluntaryContributions
        .filter((c) => {
          if (c.userId === user.id) return true;
          if (uEmail && c.userId.toLowerCase() === uEmail) return true;
          return false;
        })
        .reduce((sum, c) => sum + c.amount, 0);

      const userLedgerPaid = ledger
        .filter((e) => {
          if (e.type !== 'Contribution') return false;
          const desc = e.description.toLowerCase();
          return (
            (uName && desc.includes(uName)) ||
            (uEmail && desc.includes(uEmail)) ||
            (uId && desc.includes(uId))
          );
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const effectiveReg = Math.max(userPaidReg, userLedgerPaid);
      const hasDirectPayments = effectiveReg > 0 || userPaidVol > 0;
      const userTotalContributed = hasDirectPayments ? (effectiveReg + userPaidVol) : fallbackPerMember;
      const userRegularBase = hasDirectPayments ? effectiveReg : fallbackPerMember;

      const userEmergency = Math.round((userRegularBase * split.emergencyRatio) / 100) + (hasDirectPayments ? userPaidVol : 0);
      const userWealth = userRegularBase - Math.round((userRegularBase * split.emergencyRatio) / 100);
      const userDividend = completedRounds.reduce((sum, r) => sum + (r.dividendPerMember ?? 0), 0);
      const wonRound = pastWinners.get(user.id);

      const emergencySharePercent = emergencyPool > 0
        ? Number(((userEmergency / emergencyPool) * 100).toFixed(1))
        : Number((100 / memberCount).toFixed(1));

      return {
        userId: user.id,
        userName: user.name,
        totalContributed: userTotalContributed,
        emergencyShare: userEmergency,
        wealthShare: userWealth,
        emergencySharePercent,
        dividendEarned: userDividend,
        hasWonPot: !!wonRound,
        wonRound,
        monthlyCommitment: user.monthlyCommitment ?? membership?.monthlyCommitment ?? activeCircle.minContribution ?? 1000
      };
    });

    const activeRoundObj = rounds.find((r) => r.status === 'Active');
    const activeRoundNum = activeRoundObj ? activeRoundObj.roundNumber : 1;
    const totalMonthlyCommitment = memberShares.reduce((s, m) => s + (m.monthlyCommitment || 1000), 0);
    const calculatedPot = Math.round(totalMonthlyCommitment * (split.wealthRatio / 100));
    const fallbackPot = Math.round((activeCircle.minContribution || 1000) * memberCount * (split.wealthRatio / 100));
    const potPerRound = calculatedPot > 0 ? calculatedPot : fallbackPot;

    // Dynamically sync all chit rounds with actual pool pot amount and member count
    const dynamicChitRounds: ChitRound[] = rounds.map((r) => {
      const discountBid = r.discountBid ?? 0;
      const roundPot = potPerRound;
      const payoutAmount = Math.max(roundPot - discountBid, 0);
      const dividendPerMember = memberCount > 0 ? Math.round(discountBid / memberCount) : 0;

      return {
        ...r,
        potAmount: roundPot,
        payoutAmount: r.status === 'Completed' ? (discountBid > 0 ? payoutAmount : roundPot) : payoutAmount,
        dividendPerMember,
        participantsCount: memberCount
      };
    });

    // Calculate completed chit payouts disbursed to past winners
    const totalChitDisbursed = dynamicChitRounds
      .filter((r) => r.status === 'Completed')
      .reduce((sum, r) => sum + (r.payoutAmount ?? r.potAmount ?? 0), 0);

    const totalWealthAllocated = baseRegularTotal - emergencyFromRegular;
    const wealthPool = Math.max(0, totalWealthAllocated - totalChitDisbursed);

    return {
      totalContributed,
      emergencyPool,
      wealthPool,
      totalWealthAllocated,
      totalChitDisbursed,
      emergencyRatio: split.emergencyRatio,
      wealthRatio: split.wealthRatio,
      activeRound: activeRoundNum,
      totalRounds: rounds.length || Math.max(memberCount, 12),
      totalDividendsDistributed,
      chitRounds: dynamicChitRounds,
      memberShares,
      potPerRound
    };
  }

  public async conductChitDraw(roundId: string, winnerId: string, winnerName: string, discountBid = 0): Promise<ChitRound> {
    const overview = await this.getOverview();
    const dynamicPot = overview.potPerRound;
    const rounds = await fetchChitRoundsFromDB();
    const roundIdx = rounds.findIndex((r) => r.id === roundId);
    if (roundIdx === -1 || !rounds[roundIdx]) throw new Error('Round not found');

    const round = rounds[roundIdx]!;
    const effectivePot = dynamicPot > 0 ? dynamicPot : round.potAmount;
    const payoutAmount = Math.max(effectivePot - discountBid, 0);
    const dividendPerMember = overview.memberShares.length > 0 ? Math.round(discountBid / overview.memberShares.length) : 0;

    const mockHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const updatedRound: ChitRound = {
      ...round,
      status: 'Completed',
      winnerId,
      winnerName,
      potAmount: effectivePot,
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
        potAmount: effectivePot,
        drawDate: '2026-11-20'
      };
      await saveChitRoundInDB(nextRound);
    }

    return updatedRound;
  }
}

export const wealthService = new WealthService();
export type { WealthService };

