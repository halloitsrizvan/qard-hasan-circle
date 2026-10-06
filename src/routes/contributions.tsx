import { createFileRoute } from '@tanstack/react-router';
import { ContributionsView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';
export const Route=createFileRoute('/contributions')({head:()=>circleHead('Contributions','The contributions that sustain the Mahallu community lending circle.'),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(circleQueries.contributions),context.queryClient.ensureQueryData(circleQueries.members)])},component:ContributionsView});
