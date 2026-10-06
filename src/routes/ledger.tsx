import { createFileRoute } from '@tanstack/react-router';
import { LedgerView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
import { circleQueries } from '@/lib/services';
export const Route=createFileRoute('/ledger')({head:()=>circleHead('Transparent Ledger','Every contribution, disbursement, and repayment in one reconciled community record.'),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(circleQueries.ledger)])},component:LedgerView});
