import { createFileRoute } from '@tanstack/react-router';
import { WealthPage } from '@/components/wealth/wealth-page';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';

export const Route = createFileRoute('/wealth')({
  head: () =>
    circleHead(
      'Wealth & Chit Fund',
      'Non-custodial 70-30 dual pool: emergency Qard Hasan and rotating chit savings with auction dividends.'
    ),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(circleQueries.wealth);
  },
  component: WealthPage
});
