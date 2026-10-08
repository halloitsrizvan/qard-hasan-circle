import { useState } from 'react';
import {
  Sparkles,
  Award,
  Calendar,
  CheckCircle,
  ExternalLink,
  Coins,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Dice5,
  Gavel
} from 'lucide-react';
import type { ChitRound } from '@/lib/types';
import { Money, RoleGate } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface ChitRoundsTrackerProps {
  rounds: ChitRound[];
  activeRoundNumber: number;
  onSelectRound: (round: ChitRound) => void;
}

export function ChitRoundsTracker({ rounds, activeRoundNumber, onSelectRound }: ChitRoundsTrackerProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'active' | 'upcoming'>('all');

  const filteredRounds = rounds.filter((r) => {
    if (filter === 'completed') return r.status === 'Completed';
    if (filter === 'active') return r.status === 'Active';
    if (filter === 'upcoming') return r.status === 'Upcoming';
    return true;
  });

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            <Coins size={14} className="text-gold" />
            ROTATING SAVINGS & CREDIT (BHISHI / ROSCA)
          </div>
          <h2 className="mt-1 font-display text-xl font-bold">12-Month Rotating Chit Rounds</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Non-custodial pot rotation: everyone contributes, one member claims the pot each month through verifiable lucky draw.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-xl border bg-secondary/60 p-1 text-xs">
          {(['all', 'active', 'completed', 'upcoming'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 font-medium capitalize transition-colors text-xs ${
                filter === f ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Rounds Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRounds.map((round) => {
          const isCurrent = round.status === 'Active';
          const isCompleted = round.status === 'Completed';

          return (
            <div
              key={round.id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                isCurrent
                  ? 'border-gold bg-gold-soft/30 shadow-sm ring-1 ring-gold/40'
                  : isCompleted
                  ? 'border-border bg-card shadow-soft'
                  : 'border-border/60 bg-muted/20 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Round #{round.roundNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isCurrent
                        ? 'bg-gold-soft text-gold-foreground font-semibold'
                        : isCompleted
                        ? 'bg-secondary text-primary font-semibold'
                        : 'bg-secondary/70 text-muted-foreground'
                    }`}
                  >
                    <Dice5 size={11} />
                    {round.status}
                  </span>
                </div>

                <p className="mt-2 font-display text-base font-bold">{round.month}</p>
                <div className="mt-0.5 flex items-baseline gap-1 text-xs">
                  <span className="text-muted-foreground">Pot:</span>
                  <span className="font-semibold text-foreground"><Money amount={round.potAmount} /></span>
                </div>

                {isCompleted && (
                  <div className="mt-3 space-y-1.5 rounded-lg border bg-secondary/30 p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Award size={13} className="text-gold" />
                      <span>{round.winnerName}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Lucky draw winner · Full payout</div>
                  </div>
                )}

                {isCurrent && (
                  <div className="mt-3 space-y-1 rounded-lg border border-gold/40 bg-gold-soft/50 p-2.5 text-xs text-gold-foreground">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Sparkles size={13} className="text-gold" />
                      <span>Draw Pending</span>
                    </div>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      Ready for monthly lucky draw selection.
                    </p>
                  </div>
                )}

                {!isCompleted && !isCurrent && (
                  <div className="mt-3 rounded-lg bg-secondary/30 p-2.5 text-[10px] text-muted-foreground">
                    Scheduled · {round.participantsCount} participants
                  </div>
                )}
              </div>

              {/* Action / Entropy verification footer */}
              <div className="mt-4 border-t pt-2.5">
                {isCompleted && round.entropyHash ? (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-primary" /> Verified
                    </span>
                    <span className="font-mono text-[9px] truncate max-w-[100px]" title={round.entropyHash}>
                      {round.entropyHash.slice(0, 8)}...
                    </span>
                  </div>
                ) : isCurrent ? (
                  <RoleGate
                    allowed={['Committee Admin']}
                    fallback={
                      <div className="rounded-lg bg-gold-soft/40 py-1.5 text-center text-[10px] font-semibold text-gold-foreground">
                        Round Active · Draw Pending
                      </div>
                    }
                  >
                    <Button
                      size="sm"
                      onClick={() => onSelectRound(round)}
                      className="w-full h-8 gap-1.5 rounded-lg text-xs font-medium"
                    >
                      Conduct Draw <ChevronRight size={12} />
                    </Button>
                  </RoleGate>
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center">Awaiting round turn</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
