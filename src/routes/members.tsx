import { createFileRoute } from '@tanstack/react-router';
import { MembersView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';
export const Route=createFileRoute('/members')({head:()=>circleHead('Circle Members','Meet the community behind Mahallu Qard Hasan Circle.'),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(circleQueries.members)])},component:MembersView});
