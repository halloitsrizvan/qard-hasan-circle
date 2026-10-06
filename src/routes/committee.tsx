import { createFileRoute } from '@tanstack/react-router';
import { CommitteeView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';
export const Route=createFileRoute('/committee')({head:()=>circleHead('Committee Console','An overview of pending community support requests for the circle committee.'),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(circleQueries.loans),context.queryClient.ensureQueryData(circleQueries.members)])},component:CommitteeView});
