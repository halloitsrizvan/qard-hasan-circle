import { createFileRoute } from '@tanstack/react-router';
import { RulesView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
export const Route=createFileRoute('/rules')({head:()=>circleHead('Rules and Principles','The principal-only rules and compassionate principles of Mahallu Qard Hasan Circle.'),component:RulesView});
