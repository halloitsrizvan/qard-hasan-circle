import { describe, expect, it, beforeAll } from 'vitest';
import { authService, circleService, contributionService, loanService, ledgerService } from '@/lib/services';

describe('circle foundation', () => {
  beforeAll(async () => {
    await circleService.seedDB(true);
  }, 30000);

  it('has all seed rows and exactly reconciled append-only demo records', async () => {
    const [circle, members, contributions, loans, ledger] = await Promise.all([
      circleService.getActive(),
      circleService.getMembers(),
      contributionService.list(),
      loanService.list(),
      ledgerService.list()
    ]);
    expect(members).toHaveLength(12);
    expect(contributions).toHaveLength(14);
    expect(loans).toHaveLength(6);
    expect(ledger).toHaveLength(40);
    let running = 0;
    for (const e of ledger) {
      running += e.amount;
      expect(e.balance).toBe(running);
      expect(running).toBeGreaterThanOrEqual(0);
    }
    expect(running).toBe(circle.balance);
    expect(circle.balance).toBe(150000);
    expect(await ledgerService.verify()).toBe(true);
    expect(ledger.filter((e) => e.type === 'Contribution').reduce((sum, e) => sum + e.amount, 0)).toBe(
      contributions.reduce((sum, e) => sum + e.amount, 0)
    );
    expect(ledger.filter((e) => e.type === 'Repayment').reduce((sum, e) => sum + e.amount, 0)).toBe(
      loans.reduce((sum, l) => sum + l.repaid, 0)
    );
  });

  it('keeps repayments equal to principal and never introduces fees', async () => {
    for (const l of await loanService.list()) {
      const installments = await loanService.getInstallments(l.id);
      expect(installments.reduce((sum, i) => sum + i.amount, 0)).toBe(l.amount);
    }
  });

  it('switches all demo roles and protects seed records from caller mutation', async () => {
    for (const role of ['Super Admin', 'Committee Admin', 'Member', 'Guarantor', 'Auditor'] as const) {
      expect((await authService.getDemoUser(role)).role).toBe(role);
    }
    const c = await circleService.getActive();
    c.balance = 0;
    expect((await circleService.getActive()).balance).toBe(150000);
  });

  it('allows super admin to reassign any user role and membership status', async () => {
    const updatedUser = await circleService.updateUserRole('u2', 'Committee Admin');
    expect(updatedUser.role).toBe('Committee Admin');
    const members = await circleService.getMembers();
    const u2 = members.find((m) => m.user.id === 'u2');
    expect(u2?.user.role).toBe('Committee Admin');

    // Revert back
    await circleService.updateUserRole('u2', 'Member');
  });
});