import { createFileRoute } from '@tanstack/react-router';
import { PublicLandingPage } from '@/components/public/public-landing';
import { circleHead } from '@/lib/route-head';

export const Route = createFileRoute('/welcome')({
  head: () =>
    circleHead(
      'Welcome to Qard Hasan Circles',
      'Reviving zero-interest mutual care, community pool savings, and transparent Shariah-compliant micro-lending for Mahallu communities.'
    ),
  component: PublicLandingPage
});
