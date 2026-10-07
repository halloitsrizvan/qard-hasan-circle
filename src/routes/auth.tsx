import { createFileRoute } from '@tanstack/react-router';
import { circleHead } from '@/lib/route-head';
import { PublicLandingPage } from '@/components/public/public-landing';
import { useEffect } from 'react';
import { useDemo } from '@/lib/demo-context';

function AuthRouteComponent() {
  const { setAuthModalOpen } = useDemo();

  useEffect(() => {
    setAuthModalOpen(true);
  }, [setAuthModalOpen]);

  return <PublicLandingPage />;
}

export const Route = createFileRoute('/auth')({
  head: () =>
    circleHead(
      'Sign In / Join Circle',
      'Authenticate with Firebase or Google to access your Mahallu Qard Hasan Circle.'
    ),
  component: AuthRouteComponent
});
