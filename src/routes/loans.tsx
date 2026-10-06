import { createFileRoute } from '@tanstack/react-router';
import { LoansView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';
export const Route=createFileRoute('/loans')({head:()=>circleHead('Community Loans','Interest-free loans that support families in the Mahallu circle.'),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(circleQueries.loans),context.queryClient.ensureQueryData(circleQueries.members)])},component:LoansView});
