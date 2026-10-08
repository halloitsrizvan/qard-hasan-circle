import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  Coins,
  Sparkles,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Layers,
  Award,
  ShieldCheck,
  MapPin,
  HeartHandshake
} from 'lucide-react';
import { Money, RoleGate } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { WealthOverview } from '@/lib/types';
import pattern from '@/assets/circle-pattern.jpg';

interface WealthPoolCardsProps {
  overview: WealthOverview;
  onOpenAdminConfig: () => void;
  onOpenDrawModal: () => void;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 750, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <Money amount={display} />;
}

export function WealthPoolCards({ overview, onOpenAdminConfig, onOpenDrawModal }: WealthPoolCardsProps) {
  const {
    totalContributed,
    emergencyPool,
    wealthPool,
    emergencyRatio,
    wealthRatio,
    activeRound,
    totalRounds,
    totalDividendsDistributed,
    potPerRound
  } = overview;

  return (
    <div className="space-y-6">
      {/* Top Banner: Matching Dashboard "OUR SHARED COMMUNITY FUND" styling */}
      <section className="relative overflow-hidden rounded-2xl bg-hero px-6 py-6 text-hero-foreground sm:px-7 sm:py-7">
        <img src={pattern} alt="" width={1536} height={512} className="hero-pattern" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] text-hero-muted">
                <span className="flex size-6 items-center justify-center rounded-full border border-hero-muted/30">
                  <Layers size={13} />
                </span>
                DUAL-PURPOSE SHARIAH FINANCIAL ENGINE
              </div>
              <h2 className="mt-3 font-display text-[24px]">Qard Hasan & Wealth-Building Chit Fund</h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-hero-muted">
                Every monthly contribution is governed by a dual-allocation model: providing
                <span className="font-semibold text-hero-foreground"> {emergencyRatio}% interest-free emergency relief</span> while channeling
                <span className="font-semibold text-gold"> {wealthRatio}% into rotating Chit (Bhishi) savings</span> and shared auction dividends.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-hero-muted/30 bg-hero/30 px-3 py-1.5 text-[10px] text-hero-foreground">
                <ShieldCheck size={12} className="text-gold" />
                Dual Governance · {emergencyRatio}/{wealthRatio} Split
              </span>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div className="mt-6 rounded-xl border border-hero-muted/20 bg-hero/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-hero-muted">
              <span className="flex items-center gap-1.5 text-hero-foreground">
                <Shield size={12} className="text-gold" />
                Emergency Loan Reserve ({emergencyRatio}%) — <Money amount={emergencyPool} />
              </span>
              <span className="flex items-center gap-1.5 text-gold">
                <Coins size={12} />
                Wealth & Chit Pot ({wealthRatio}%) — <Money amount={wealthPool} />
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-hero-muted/20">
              <div
                className="h-full rounded-full bg-hero-foreground transition-all duration-700 ease-out"
                style={{ width: `${emergencyRatio}%` }}
              />
            </div>
          </div>

          {/* Bottom Actions & Totals */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div className="flex items-center gap-4 text-[10px] text-hero-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-gold" />
                Total Contributed: <Money amount={totalContributed} className="font-semibold text-hero-foreground" />
              </span>
              <span className="h-3 border-l border-hero-muted/30" />
              <span>Round {activeRound} of {totalRounds} in progress</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <RoleGate allowed={['Committee Admin']}>
                <Button
                  onClick={onOpenAdminConfig}
                  variant="outline"
                  className="h-10 border-hero-muted/35 bg-hero/30 px-4 text-xs font-medium text-hero-foreground hover:bg-hero-muted/10 hover:text-hero-foreground"
                >
                  <Sliders size={14} />
                  Configure Ratio ({emergencyRatio}/{wealthRatio})
                </Button>
              </RoleGate>

              <RoleGate allowed={['Committee Admin']}>
                <Button
                  onClick={onOpenDrawModal}
                  className="h-10 bg-hero-foreground px-4 text-xs font-medium text-hero hover:bg-hero-foreground/90"
                >
                  <Sparkles size={14} />
                  Active Round #{activeRound} Draw
                </Button>
              </RoleGate>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Sub-Pool Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Card 1: Emergency Loan Pool */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Shield size={20} strokeWidth={1.7} />
              </span>
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Sub-Pool A · {emergencyRatio}%
                </span>
                <h3 className="font-display text-lg font-bold">Qard Hasan Emergency Fund</h3>
              </div>
            </div>
            <span className="rounded-full border bg-secondary/50 px-2.5 py-0.5 text-[10px] font-medium text-primary">
              0% Interest
            </span>
          </div>

          <div className="mt-5">
            <p className="text-[11px] text-muted-foreground">Accumulated Emergency Reserve</p>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              <AnimatedNumber value={emergencyPool} />
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t pt-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Purpose</span>
              <span className="font-medium text-foreground">Medical, Education, Urgent Relief</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Repayment Policy</span>
              <span className="font-medium text-foreground">Principal-only · Strict Shariah</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Governance</span>
              <span className="font-medium text-foreground">Mahallu Committee Consensus</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground">
            <CheckCircle2 size={14} className="shrink-0 text-primary" />
            <span>Provides financial peace of mind. Capital returns to the pool upon repayment.</span>
          </div>
        </div>

        {/* Card 2: Future Wealth & Chit Pot */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-gold-foreground">
                <Coins size={20} strokeWidth={1.7} />
              </span>
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Sub-Pool B · {wealthRatio}%
                </span>
                <h3 className="font-display text-lg font-bold">Future Wealth & Chit Pot</h3>
              </div>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold-soft px-2.5 py-0.5 text-[10px] font-medium text-gold-foreground">
              Bhishi ROSCA
            </span>
          </div>

          <div className="mt-5">
            <p className="text-[11px] text-muted-foreground">Available Wealth & Chit Pool</p>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              <AnimatedNumber value={wealthPool} />
            </div>
            {overview.totalChitDisbursed ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Net remaining after deducting <Money amount={overview.totalChitDisbursed} className="font-medium text-amber-600" /> paid to past winners
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-2 border-t pt-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Total 30% Pool Allocation</span>
              <span className="font-medium text-foreground">
                <Money amount={overview.totalWealthAllocated ?? Math.round((totalContributed * wealthRatio) / 100)} />
              </span>
            </div>
            {overview.totalChitDisbursed ? (
              <div className="flex items-center justify-between">
                <span>Disbursed to Past Winners</span>
                <span className="font-semibold text-amber-600">
                  -<Money amount={overview.totalChitDisbursed} />
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span>Current Pot per Round</span>
              <span className="font-semibold text-foreground"><Money amount={potPerRound} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Dividends Paid</span>
              <span className="font-semibold text-primary">
                +<Money amount={totalDividendsDistributed} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Round Progression</span>
              <span className="font-medium text-foreground">Round {activeRound} of {totalRounds} Active</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-gold-soft/60 p-3 text-[11px] text-muted-foreground">
            <Sparkles size={14} className="shrink-0 text-gold" />
            <span>Non-custodial rotation: one member takes the pot each cycle, auction discounts split as dividends.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
