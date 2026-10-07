import { describe, expect, it } from 'vitest';
import { wealthService } from '@/lib/services';

describe('wealth & chit service foundation', () => {
  it('calculates the default 70-30 dual pool allocation correctly', async () => {
    const overview = await wealthService.getOverview();
    expect(overview.emergencyRatio).toBe(70);
    expect(overview.wealthRatio).toBe(30);
    expect(overview.totalContributed).toBe(210000);
    expect(overview.emergencyPool).toBe(147000);
    expect(overview.wealthPool).toBe(63000);
    expect(overview.chitRounds).toHaveLength(12);
  });

  it('allows committee admin to update the ratio and recalculate pool shares', async () => {
    await wealthService.updateSplitConfig(80, 20, 'Admin Test');
    const updated = await wealthService.getOverview();
    expect(updated.emergencyRatio).toBe(80);
    expect(updated.wealthRatio).toBe(20);
    expect(updated.emergencyPool).toBe(168000);
    expect(updated.wealthPool).toBe(42000);

    // Reset back to 70/30
    await wealthService.updateSplitConfig(70, 30, 'Admin Test');
  });

  it('conducts chit round draws, distributes auction dividends and logs entropy hash', async () => {
    const overview = await wealthService.getOverview();
    const activeRound = overview.chitRounds.find((r) => r.status === 'Active') || overview.chitRounds[0];
    if (!activeRound) throw new Error('No active round found');

    const result = await wealthService.conductChitDraw(activeRound.id, 'u2', 'Rahim Mohammed', 3600);
    expect(result.status).toBe('Completed');
    expect(result.winnerName).toBe('Rahim Mohammed');
    expect(result.payoutAmount).toBe(32400);
    expect(result.dividendPerMember).toBe(300);
    expect(result.entropyHash).toMatch(/^0x/);
  });
});
