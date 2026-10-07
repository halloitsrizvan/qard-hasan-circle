import { createFileRoute } from '@tanstack/react-router';
import { OverviewPage } from '@/components/circle/overview';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';

export const Route = createFileRoute('/dashboard')({
  head: () =>
    circleHead(
      'Circle Overview',
      'A transparent view of the Mahallu interest-free lending pool, community contributions, and principal-only repayments.'
    ),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(circleQueries.overview),
      context.queryClient.ensureQueryData(circleQueries.loans),
      context.queryClient.ensureQueryData(circleQueries.ledger),
      context.queryClient.ensureQueryData(circleQueries.members),
      context.queryClient.ensureQueryData(circleQueries.wealth)
    ]);
  },
  component: OverviewPage
});
