import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '@/components/circle/data-views';
import { circleHead } from '@/lib/route-head';
export const Route=createFileRoute('/settings')({head:()=>circleHead('Your Profile','Your demo circle profile and appearance preferences.'),component:SettingsView});
