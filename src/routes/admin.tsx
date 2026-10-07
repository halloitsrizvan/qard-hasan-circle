import { createFileRoute } from '@tanstack/react-router';
import { SuperAdminView } from '@/components/circle/super-admin-view';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';

export const Route = createFileRoute('/admin')({
  head: () =>
    circleHead(
      'Super Admin Hub',
      'Central management console for Mahalls, overall network metrics, and multi-tier role assignments.'
    ),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(circleQueries.allCircles),
      context.queryClient.ensureQueryData(circleQueries.allUsersWithMahallu),
      context.queryClient.ensureQueryData(circleQueries.superAdminStats)
    ]);
  },
  component: SuperAdminView
});
