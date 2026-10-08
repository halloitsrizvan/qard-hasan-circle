import { describe, expect, it, beforeAll } from 'vitest';
import { wealthService, circleService } from '@/lib/services';

describe('wealth & chit service foundation', () => {
  beforeAll(async () => {
    await circleService.seedDB(true);
  }, 30000);

  it('calculates the default 70-30 dual pool allocation correctly for clean baseline', async () => {
    const overview = await wealthService.getOverview();
    expect(overview.emergencyRatio).toBe(70);
    expect(overview.wealthRatio).toBe(30);
    expect(overview.totalContributed).toBe(57000);
    expect(overview.emergencyPool).toBe(39900);
    expect(overview.totalWealthAllocated).toBe(17100);
    expect(overview.totalChitDisbursed).toBe(7200);
    expect(overview.wealthPool).toBe(9900);
  });

  it('allows committee admin to update the ratio and recalculate pool shares', async () => {
    await wealthService.updateSplitConfig(80, 20, 'Admin Test');
    const updated = await wealthService.getOverview();
    expect(updated.emergencyRatio).toBe(80);
    expect(updated.wealthRatio).toBe(20);
    expect(updated.emergencyPool).toBe(45600);
    expect(updated.totalWealthAllocated).toBe(11400);
    expect(updated.wealthPool).toBe(6600);

    // Reset back to 70/30
    await wealthService.updateSplitConfig(70, 30, 'Admin Test');
  });
});
