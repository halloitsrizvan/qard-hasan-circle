import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  ChevronDown,
  CirclePlus,
  Coins,
  HandCoins,
  HeartHandshake,
  Layers,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Money,
  StatusChip,
  StatCard,
  SectionHeading,
  PrinciplesNote,
  RoleGate,
  formatDate
} from '@/components/shared';
import { circleQueries } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import { useI18n } from '@/lib/i18n';
import { RequestLoanModal, ContributeModal, DemoTourModal } from './modals';
import pattern from '@/assets/circle-pattern.jpg';

function AnimatedBalance({ amount }: { amount: number }) {
  const [display, setDisplay] = useState(amount);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setDisplay(Math.round(amount * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [amount]);
  return <Money amount={display} />;
}

export function OverviewPage() {
  const { circle, user, role } = useDemo();
  const { t } = useI18n();
  const { data: stats } = useSuspenseQuery(circleQueries.overview);
  const { data: loans } = useSuspenseQuery(circleQueries.loans);
  const { data: entries } = useSuspenseQuery(circleQueries.ledger);
  const { data: members } = useSuspenseQuery(circleQueries.members);
  const { data: wealth } = useSuspenseQuery(circleQueries.wealth);

  const [period, setPeriod] = useState('12');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);

  let contributions = 0,
    lent = 0;
  const trend = stats.trend
    .map((p) => {
      contributions += p.contributions;
      lent += p.loans;
      return { ...p, contributions, loans: lent };
    })
    .slice(-Number(period));

  const active = loans.filter((l) => ['Active', 'Overdue', 'Requested', 'Guarantor pending'].includes(l.status));

  return (
    <div className="page-enter">
      {/* Top Greeting */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-[.1em] text-primary">
            <span className="h-px w-5 bg-gold" />
            TOGETHER, WE MAKE EASE
          </div>
          <h1 className="font-display text-[30px] leading-tight sm:text-[34px]">
            Assalamu alaikum, {user?.name.split(' ')[0] ?? 'Abdul'}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {role === 'Committee Admin'
              ? 'Here’s how your community is caring for one another.'
              : role === 'Auditor'
              ? 'A clear view of your circle’s funds and community records.'
              : role === 'Guarantor'
              ? 'Your trust helps make someone else’s next step possible.'
              : 'Every contribution brings our community a little closer.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border bg-card px-3 py-2 text-[10px] text-muted-foreground">
            Tuesday, 6 October 2026
          </span>
        </div>
      </div>

      {/* Hero Pool Card */}
      <section className="relative overflow-hidden rounded-2xl bg-hero px-6 py-6 text-hero-foreground sm:px-7 sm:py-7">
        <img src={pattern} alt="" width={1536} height={512} className="hero-pattern" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-hero-muted">
                <span className="flex size-6 items-center justify-center rounded-full border border-hero-muted/30">
                  <HeartHandshake size={13} />
                </span>
                OUR SHARED COMMUNITY FUND
              </div>
              <h2 className="mt-3 font-display text-[24px]">{circle?.name ?? 'Mahallu Qard Hasan Circle'}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-hero-muted">
                <MapPin size={12} />
                {circle?.mosque ?? 'Perinthalmanna Juma Masjid'} · Kerala
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-hero-muted/30 bg-hero/30 px-3 py-1.5 text-[10px] text-hero-foreground">
              <ShieldCheck size={12} className="text-gold" />
              {t.interestFreeAlways}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[11px] text-hero-muted">{t.poolBalance}</p>
              <div className="mt-1 text-[39px] font-medium leading-tight sm:text-[44px]">
                <AnimatedBalance amount={stats.available} />
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px] text-hero-muted">
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {members.length} members
                </span>
                <span className="h-3 border-l border-hero-muted/30" />
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-gold" />
                  Making a difference since Jan 2026
                </span>
              </div>
            </div>

            <RoleGate allowed={['Committee Admin', 'Member', 'Guarantor']}>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setContributeModalOpen(true)}
                  className="h-10 bg-hero-foreground px-4 text-hero hover:bg-hero-foreground/90 font-medium"
                >
                  <CirclePlus size={15} />
                  {t.contribute}
                </Button>
                <Button
                  onClick={() => setRequestModalOpen(true)}
                  variant="outline"
                  className="h-10 border-hero-muted/35 bg-hero/30 px-4 text-hero-foreground hover:bg-hero-muted/10 hover:text-hero-foreground font-medium"
                >
                  <HandCoins size={15} />
                  {t.requestLoan}
                </Button>
              </div>
            </RoleGate>
          </div>
        </div>
      </section>

      {/* Dual Pool 70-30 Governance Card */}
      <div className="my-5 rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Layers size={20} strokeWidth={1.7} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">Dual-Fund Architecture ({wealth.emergencyRatio}% Emergency / {wealth.wealthRatio}% Wealth & Chit)</p>
                <span className="rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold-foreground">
                  Round #{wealth.activeRound} Active
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                <Money amount={wealth.emergencyPool} /> in 0% Qard emergency reserves · <Money amount={wealth.wealthPool} /> in rotating Chit & dividend fund
              </p>
            </div>
          </div>

          <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs font-medium">
            <Link to="/wealth">
              Explore Wealth & Chit Pot <ArrowRight size={13} />
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="my-5 grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
        <StatCard
          title={t.totalContributed}
          amount={stats.contributed}
          note="14 contributions, one purpose"
          icon={Wallet}
        />
        <StatCard
          title={t.currentlyLent}
          amount={stats.lentOut}
          note="2 families being supported"
          icon={HandCoins}
        />
        <StatCard
          title={t.principalRepaid}
          amount={stats.repaid}
          note="Returning hope to the pool"
          icon={ArrowDownLeft}
        />
        <StatCard
          title={t.availableToLend}
          amount={stats.available}
          note="Ready for someone in need"
          icon={Banknote}
        />
      </div>

      {/* Chart & Promises Kept Section */}
      <div className="grid gap-5 xl:grid-cols-[1fr_285px]">
        <section className="min-w-0 rounded-2xl border bg-card p-5 shadow-soft">
          <SectionHeading
            title="A growing circle of good"
            subtitle="Contributions and loans, over time"
            action={
              <label className="relative">
                <span className="sr-only">Chart period</span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="appearance-none rounded-md border bg-background py-1.5 pl-2.5 pr-7 text-[10px]"
                >
                  <option value="12">Last 12 months</option>
                  <option value="6">Last 6 months</option>
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-2.5 text-muted-foreground" />
              </label>
            }
          />
          <div className="mb-3 flex gap-5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              Contributions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-gold" />
              Loans disbursed
            </span>
          </div>
          <div className="h-[204px] w-full" aria-label="Cumulative contributions and loans disbursed">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 5, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="contributionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.13} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tickFormatter={(v) => `₹${v / 1000}k`}
                  tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 50000, 100000, 150000, 200000]}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="chart-tooltip">
                        <p className="mb-2 font-medium">{label}</p>
                        {payload.map((p) => (
                          <p key={p.dataKey} className="my-1 text-muted-foreground">
                            {p.dataKey === 'contributions' ? 'Contributions' : 'Loans'}:{' '}
                            <Money amount={Number(p.value)} />
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#contributionFill)"
                />
                <Area type="monotone" dataKey="loans" stroke="var(--gold)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl">Promises kept</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t.repaymentHealth}</p>
          <div className="relative mx-auto my-2 h-[150px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: stats.repaymentRate }, { value: 100 - stats.repaymentRate }]}
                  innerRadius={56}
                  outerRadius={66}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={7}
                >
                  <Cell fill="var(--primary)" />
                  <Cell fill="var(--secondary)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[30px] font-semibold">{stats.repaymentRate}%</span>
              <span className="mt-1 text-[10px] text-muted-foreground">on-time repayments</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            A healthy, caring circle
          </div>
          <p className="mt-4 border-t pt-3 text-center text-[10px] leading-5 text-muted-foreground">
            Flexibility in hardship.
            <br />
            Dignity in every repayment.
          </p>
        </section>
      </div>

      {/* Active Loans & Recent Ledger */}
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="min-w-0 rounded-2xl border bg-card p-5 shadow-soft">
          <SectionHeading
            title={role === 'Guarantor' ? 'Requests in your circle' : 'Loans that make a difference'}
            subtitle="Small acts of support. Meaningful new beginnings."
            action={
              <Button asChild variant="link" className="h-auto p-0 text-[10px]">
                <Link to="/loans">
                  View all <ArrowRight size={12} />
                </Link>
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-[9px] font-medium text-muted-foreground">
                  <th className="pb-3 font-medium">{role === 'Committee Admin' ? 'MEMBER' : 'LOAN'}</th>
                  <th className="pb-3 font-medium">PRINCIPAL</th>
                  <th className="pb-3 font-medium">STATUS</th>
                  <th className="pb-3 text-right font-medium">REPAID</th>
                </tr>
              </thead>
              <tbody>
                {active.map((l) => {
                  const borrower = members.find((m) => m.user.id === l.userId)?.user;
                  return (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] text-primary sm:flex">
                            {role === 'Committee Admin' ? borrower?.initials : <HandCoins size={14} />}
                          </span>
                          <div>
                            <p className="whitespace-nowrap text-[11px] font-medium">
                              {role === 'Committee Admin' ? borrower?.name : l.id}
                            </p>
                            <p className="mt-1 text-[9px] text-muted-foreground">
                              {role === 'Committee Admin' ? l.purpose : 'Community support'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="pr-3 text-[11px] font-medium">
                        <Money amount={l.amount} />
                      </td>
                      <td className="pr-2">
                        <StatusChip status={l.status} />
                      </td>
                      <td className="text-right text-[10px] text-muted-foreground">
                        {Math.round((l.repaid / l.amount) * 100)}%
                        <div className="ml-auto mt-2 h-1 w-12 overflow-hidden rounded-full bg-secondary">
                          <div className={l.repaid > 0 ? 'h-full w-1/4 rounded-full bg-primary' : 'h-full w-0'} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <SectionHeading
            title="The latest in our ledger"
            action={
              <Button asChild variant="ghost" size="icon" className="size-6 text-muted-foreground">
                <Link to="/ledger" aria-label="View ledger">
                  <ArrowUpRight size={14} />
                </Link>
              </Button>
            }
          />
          {entries
            .slice(-3)
            .reverse()
            .map((e) => (
              <div key={e.id} className="flex items-center gap-3 border-b py-3.5 first:pt-0 last:border-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <ArrowDownLeft size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium">
                    {e.type === 'Repayment' ? 'Installment received' : 'Pool contribution'}
                  </p>
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {formatDate(e.date)} · {e.id}
                  </p>
                </div>
                <Money amount={e.amount} sign className="text-[11px] font-medium text-primary" />
              </div>
            ))}
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-secondary/50 p-2.5 text-[9px] text-primary">
            <ShieldCheck size={13} />
            Every entry recorded. Every rupee accounted for.
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <PrinciplesNote />
        <Button asChild variant="link" className="h-auto p-0 text-[10px]">
          <Link to="/rules">
            Our principles <ArrowRight size={12} />
          </Link>
        </Button>
      </div>

      {/* Interactive Modals */}
      <RequestLoanModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        members={members}
        maxLoan={circle?.maxLoan ?? 50000}
        availableBalance={stats.available}
      />
      <ContributeModal isOpen={contributeModalOpen} onClose={() => setContributeModalOpen(false)} />
      <DemoTourModal isOpen={demoTourOpen} onClose={() => setDemoTourOpen(false)} />
    </div>
  );
}
