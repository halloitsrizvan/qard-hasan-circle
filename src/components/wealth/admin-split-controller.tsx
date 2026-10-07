import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sliders, Shield, Coins, X, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/shared';
import { wealthService } from '@/lib/services';
import { toast } from 'sonner';

interface AdminSplitControllerProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmergencyRatio: number;
  currentWealthRatio: number;
  totalContributed: number;
  onUpdated: () => void;
}

export function AdminSplitController({
  isOpen,
  onClose,
  currentEmergencyRatio,
  currentWealthRatio,
  totalContributed,
  onUpdated
}: AdminSplitControllerProps) {
  const [mounted, setMounted] = useState(false);
  const [emergencyRatio, setEmergencyRatio] = useState(currentEmergencyRatio);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setEmergencyRatio(currentEmergencyRatio);
    }
  }, [isOpen, currentEmergencyRatio]);

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

  const wealthRatio = 100 - emergencyRatio;
  const simulatedEmergency = Math.round((totalContributed * emergencyRatio) / 100);
  const simulatedWealth = totalContributed - simulatedEmergency;

  const presets = [
    { label: '70% Qard / 30% Wealth', emergency: 70 },
    { label: '80% Qard / 20% Wealth', emergency: 80 },
    { label: '60% Qard / 40% Wealth', emergency: 60 },
    { label: '50% Qard / 50% Wealth', emergency: 50 }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await wealthService.updateSplitConfig(emergencyRatio, wealthRatio);
      toast.success(`Pool split ratio updated to ${emergencyRatio}% Emergency / ${wealthRatio}% Wealth!`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error('Failed to update ratio: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEmergencyRatio(70);
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-0"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="split-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 sm:p-7 text-card-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Sliders size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2 id="split-modal-title" className="font-display text-xl font-bold">
                Community Pool Allocation Ratio
              </h2>
              <p className="text-xs text-muted-foreground">Governed by Mahallu Committee & Super Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close modal">
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Ratio Presets
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.emergency}
                  type="button"
                  onClick={() => setEmergencyRatio(p.emergency)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                    emergencyRatio === p.emergency
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'border-border bg-card text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <span>{p.label}</span>
                  {emergencyRatio === p.emergency && <Check size={14} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Slider */}
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <Shield size={14} /> Emergency Qard: {emergencyRatio}%
              </span>
              <span className="flex items-center gap-1.5 text-gold-foreground">
                <Coins size={14} /> Wealth / Chit: {wealthRatio}%
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={emergencyRatio}
              onChange={(e) => setEmergencyRatio(Number(e.target.value))}
              className="mt-4 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-primary dark:bg-zinc-700"
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>20% Qard (High Chit)</span>
              <span className="font-medium text-foreground">Current: {emergencyRatio}/{wealthRatio}</span>
              <span>90% Qard (High Loan Pool)</span>
            </div>
          </div>

          {/* Live Simulation Preview */}
          <div className="rounded-2xl border bg-secondary/20 p-4">
            <p className="text-xs font-semibold text-foreground">
              Live Simulation on Total Pool (<Money amount={totalContributed} />):
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-3 shadow-xs">
                <p className="text-[10px] font-semibold text-primary uppercase">
                  Qard Emergency Fund ({emergencyRatio}%)
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  <Money amount={simulatedEmergency} />
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Available for 0% loans</p>
              </div>

              <div className="rounded-xl border bg-card p-3 shadow-xs">
                <p className="text-[10px] font-semibold text-gold-foreground uppercase">
                  Wealth & Chit Fund ({wealthRatio}%)
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  <Money amount={simulatedWealth} />
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Rotating rounds & dividends</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-secondary/40 p-3 text-[11px] text-muted-foreground">
            <AlertCircle size={15} className="shrink-0 text-primary mt-0.5" />
            <span>
              Adjusting this ratio recalculates pool shares for active and future monthly contributions. Past ledger entries remain cryptographically signed and immutable.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground">
            <RefreshCw size={13} /> Reset to 70/30
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-medium">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {saving ? 'Saving Ratio...' : 'Save Ratio Policy'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
