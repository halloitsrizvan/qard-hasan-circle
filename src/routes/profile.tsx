import { createFileRoute } from '@tanstack/react-router';
import { ProfileView } from '@/components/circle/profile-view';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';

export const Route = createFileRoute('/profile')({
  head: () =>
    circleHead(
      'My Profile',
      'Personal emergency pool stake, rotating chit savings benefits, 2026 commitment matrix, and contribution history.'
    ),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(circleQueries.wealth),
      context.queryClient.ensureQueryData(circleQueries.members),
      context.queryClient.ensureQueryData(circleQueries.contributions),
      context.queryClient.ensureQueryData(circleQueries.loans),
      context.queryClient.ensureQueryData(circleQueries.ledger)
    ]);
  },
  component: ProfileView
});
