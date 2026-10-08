import { useState } from 'react';
import {
  Users,
  Shield,
  Coins,
  Award,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BadgePercent
} from 'lucide-react';
import type { MemberWealthShare } from '@/lib/types';
import { Money } from '@/components/shared';

interface MemberSharesTableProps {
  memberShares: MemberWealthShare[];
  emergencyRatio: number;
  wealthRatio: number;
}

export function MemberSharesTable({
  memberShares,
  emergencyRatio,
  wealthRatio
}: MemberSharesTableProps) {
  const [search, setSearch] = useState('');

  const filtered = memberShares.filter((m) =>
    m.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-7 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <Users size={14} className="text-primary" />
            COMMUNITY EQUITY & TRANSPARENCY
          </div>
          <h2 className="mt-1 font-display text-xl font-bold">Individual Member Fund Allocations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Each member holds a transparent % stake in the Qard Emergency Fund. Borrowing up to their emergency stake qualifies for Instant Self-Covered Fast-Track Lending.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-background py-1.5 pl-9 pr-4 text-xs shadow-inner"
          />
        </div>
      </div>

      {/* Equity Rule Notice */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
        <Sparkles size={16} className="shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">Self-Covered Lending Rule</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            If a member requests a loan $\le$ their emergency fund stake (% share), the loan is automatically classified as <strong>Self-Covered Fast-Track</strong> and approved without requiring an external guarantor.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-3">MEMBER</th>
              <th className="pb-3">MONTHLY COMMITMENT</th>
              <th className="pb-3">TOTAL CONTRIBUTED</th>
              <th className="pb-3">
                EMERGENCY STAKE ({emergencyRatio}%)
              </th>
              <th className="pb-3">% IN E-FUND</th>
              <th className="pb-3">
                WEALTH & CHIT ({wealthRatio}%)
              </th>
              <th className="pb-3">DIVIDENDS</th>
              <th className="pb-3 text-right">CHIT POT STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((member) => (
              <tr key={member.userId} className="transition-colors hover:bg-secondary/40">
                <td className="py-3.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                      {member.userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{member.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{member.userId}</p>
                    </div>
                  </div>
                </td>

                <td className="pr-3 font-mono font-bold text-foreground">
                  <Money amount={member.monthlyCommitment || 1000} />
                  <span className="text-[10px] text-muted-foreground font-normal">/mo</span>
                </td>

                <td className="pr-3 font-medium text-foreground">
                  <Money amount={member.totalContributed} />
                </td>

                <td className="pr-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Money amount={member.emergencyShare} />
                </td>

                <td className="pr-3">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    <BadgePercent size={12} className="text-emerald-500" />
                    {member.emergencySharePercent}%
                  </span>
                </td>

                <td className="pr-3 text-muted-foreground">
                  <Money amount={member.wealthShare} />
                </td>

                <td className="pr-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
                    +<Money amount={member.dividendEarned} />
                  </span>
                </td>

                <td className="text-right">
                  {member.hasWonPot ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 text-[10px] font-medium text-gold-foreground">
                      <Award size={12} />
                      Won Round #{member.wonRound}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock size={11} />
                      Awaiting Turn
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
