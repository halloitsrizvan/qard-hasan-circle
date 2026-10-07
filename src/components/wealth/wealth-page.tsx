import { useState } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { circleQueries, wealthService } from '@/lib/services';
import { WealthPoolCards } from './wealth-pool-cards';
import { ChitRoundsTracker } from './chit-rounds-tracker';
import { MemberSharesTable } from './member-shares-table';
import { AdminSplitController } from './admin-split-controller';
import { ChitDrawModal } from './chit-draw-modal';
import type { ChitRound } from '@/lib/types';
import { PageIntro } from '@/components/shared';

export function WealthPage() {
  const queryClient = useQueryClient();
  const { data: wealthOverview } = useSuspenseQuery(circleQueries.wealth);

  const [adminConfigOpen, setAdminConfigOpen] = useState(false);
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<ChitRound | null>(null);

  const activeRound =
    wealthOverview.chitRounds.find((r) => r.status === 'Active') || wealthOverview.chitRounds[0];

  const handleOpenDraw = (round?: ChitRound) => {
    setSelectedRound(round || activeRound || null);
    setDrawModalOpen(true);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['wealth'] });
  };

  return (
    <div className="page-enter space-y-8 pb-12">
      <PageIntro
        title="Future Wealth & Chit Fund (Bhishi)"
        description="A transparent 70-30 dual-pool financial model: community emergency Qard loans paired with rotating chit savings and shared auction dividends."
      />

      {/* Main Dual Pool Cards */}
      <WealthPoolCards
        overview={wealthOverview}
        onOpenAdminConfig={() => setAdminConfigOpen(true)}
        onOpenDrawModal={() => handleOpenDraw(activeRound)}
      />

      {/* 12-Month Rotating Chit Rounds Tracker */}
      <ChitRoundsTracker
        rounds={wealthOverview.chitRounds}
        activeRoundNumber={wealthOverview.activeRound}
        onSelectRound={(r) => handleOpenDraw(r)}
      />

      {/* Member Allocation Breakdown Table */}
      <MemberSharesTable
        memberShares={wealthOverview.memberShares}
        emergencyRatio={wealthOverview.emergencyRatio}
        wealthRatio={wealthOverview.wealthRatio}
      />

      {/* Admin Split Configuration Modal */}
      <AdminSplitController
        isOpen={adminConfigOpen}
        onClose={() => setAdminConfigOpen(false)}
        currentEmergencyRatio={wealthOverview.emergencyRatio}
        currentWealthRatio={wealthOverview.wealthRatio}
        totalContributed={wealthOverview.totalContributed}
        onUpdated={handleRefresh}
      />

      {/* Chit Draw Simulation Modal */}
      {selectedRound && (
        <ChitDrawModal
          isOpen={drawModalOpen}
          onClose={() => setDrawModalOpen(false)}
          round={selectedRound}
          memberShares={wealthOverview.memberShares}
          onDrawCompleted={handleRefresh}
        />
      )}
    </div>
  );
}
