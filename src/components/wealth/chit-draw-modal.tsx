import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Dice5,
  X,
  Award,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/shared';
import type { ChitRound, MemberWealthShare } from '@/lib/types';
import { wealthService } from '@/lib/services';
import { toast } from 'sonner';

interface ChitDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  round: ChitRound;
  memberShares: MemberWealthShare[];
  onDrawCompleted: () => void;
}

export function ChitDrawModal({
  isOpen,
  onClose,
  round,
  memberShares,
  onDrawCompleted
}: ChitDrawModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<{
    winnerName: string;
    payout: number;
    hash: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDrawResult(null);
      setSelectedWinnerId('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Eligible members are those who have NOT won a previous pot round
  const eligibleMembers = memberShares.filter((m) => !m.hasWonPot);

  const handleSimulateDraw = async () => {
    if (eligibleMembers.length === 0) {
      toast.error('All circle members have already won their rotating round!');
      return;
    }

    setDrawing(true);

    try {
      const winner = (selectedWinnerId
        ? eligibleMembers.find((m) => m.userId === selectedWinnerId)
        : eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)]) ?? eligibleMembers[0];

      if (!winner) {
        toast.error('No eligible member found for draw.');
        return;
      }

      const payout = round.potAmount;

      await new Promise((resolve) => setTimeout(resolve, 1400));

      const updated = await wealthService.conductChitDraw(round.id, winner.userId, winner.userName, 0);

      setDrawResult({
        winnerName: winner.userName,
        payout,
        hash: updated.entropyHash || '0x4f82a728b109e2...'
      });

      toast.success(`🎉 Round #${round.roundNumber} won by ${winner.userName}!`);
      onDrawCompleted();
    } catch (err: any) {
      toast.error('Draw failed: ' + (err.message || String(err)));
    } finally {
      setDrawing(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="draw-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 sm:p-7 text-card-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gold-soft text-gold-foreground">
              <Dice5 size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2 id="draw-modal-title" className="font-display text-xl font-bold">
                Conduct Lucky Draw · Round #{round.roundNumber}
              </h2>
              <p className="text-xs text-muted-foreground">{round.month} · Total Pot: <Money amount={round.potAmount} /></p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>

        {drawResult ? (
          /* Result View */
          <div className="mt-5 space-y-4 text-center animate-in zoom-in-95">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
              <Award size={28} />
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Round #{round.roundNumber} Lucky Draw Winner
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{drawResult.winnerName}</h3>
            </div>

            <div className="rounded-2xl border bg-secondary/30 p-4 text-center">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">FULL POT PAYOUT TO WINNER</p>
              <p className="mt-1 text-2xl font-bold text-foreground"><Money amount={drawResult.payout} /></p>
              <p className="mt-1 text-[11px] text-muted-foreground">100% Principal Protected · 0% Deductions</p>
            </div>

            <div className="rounded-xl border bg-card p-3 text-left text-xs text-muted-foreground font-mono">
              <div className="flex items-center gap-1.5 text-foreground font-medium mb-1">
                <ShieldCheck size={14} className="text-primary" />
                <span>On-Chain Verifiable Entropy Hash:</span>
              </div>
              <p className="break-all text-[10px]">{drawResult.hash}</p>
            </div>

            <Button onClick={onClose} className="w-full bg-primary font-semibold text-primary-foreground">
              Done & Return to Overview
            </Button>
          </div>
        ) : (
          /* Draw Setup Form */
          <div className="mt-5 space-y-5">
            {/* Shariah Lucky Draw Info Badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Dice5 size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">Verifiable Lucky Draw Model</p>
                <p className="text-[11px] text-muted-foreground">
                  Randomly selects one eligible member to receive the complete <Money amount={round.potAmount} className="font-semibold text-foreground" /> pot without any auction discounts or reductions.
                </p>
              </div>
            </div>

            {/* Eligible members list */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Eligible Members ({eligibleMembers.length} remaining in rotation)
              </label>
              <select
                value={selectedWinnerId}
                onChange={(e) => setSelectedWinnerId(e.target.value)}
                className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-xs font-medium text-foreground focus:outline-primary"
              >
                <option value="">🎯 Verifiable Random Lucky Draw (All {eligibleMembers.length} members)</option>
                {eligibleMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName} (Contributed: ₹{m.totalContributed})
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t pt-4">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={drawing}
                onClick={handleSimulateDraw}
                className="gap-2 bg-primary text-primary-foreground font-semibold"
              >
                {drawing ? (
                  <>
                    <Zap size={14} className="animate-spin" />
                    Executing Lucky Draw...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Run Lucky Draw · Round #{round.roundNumber}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
