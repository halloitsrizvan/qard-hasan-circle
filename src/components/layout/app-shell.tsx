import { useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Globe,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Leaf,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDemo } from '@/lib/demo-context';
import { useI18n, type Language } from '@/lib/i18n';
import { DemoTourModal } from '@/components/circle/modals';
import type { Role } from '@/lib/types';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <HeartHandshake size={23} strokeWidth={1.6} />
      </span>
      <span className="font-display text-xl leading-5">
        Qard Hasan
        {!compact && (
          <span className="mt-1 block font-sans text-[10px] tracking-[.2em] text-muted-foreground">CIRCLES</span>
        )}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { circle, user, role, dark, toggleTheme, switchRole } = useDemo();
  const { language, setLanguage, t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [notifications, setNotifications] = useState(false);
  const [read, setRead] = useState(false);
  const [help, setHelp] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);

  const navigation = [
    { to: '/' as const, label: t.circleOverview, icon: LayoutDashboard },
    { to: '/contributions' as const, label: t.contributions, icon: Wallet },
    { to: '/loans' as const, label: t.loans, icon: HandCoins },
    { to: '/ledger' as const, label: t.ledger, icon: BookOpen },
    { to: '/members' as const, label: t.members, icon: Users }
  ];

  const roles: Role[] = ['Committee Admin', 'Member', 'Guarantor', 'Auditor'];
  const roleDescriptions: Record<Role, string> = {
    'Committee Admin': 'Manage your community circle',
    Member: 'Contribute and view your loans',
    Guarantor: 'Review the requests you guarantee',
    Auditor: 'Explore records in read-only mode'
  };

  const pageTitles: Record<string, string> = {
    '/': t.circleOverview,
    '/contributions': t.contributions,
    '/loans': t.loans,
    '/ledger': t.ledger,
    '/members': t.members,
    '/committee': t.committee,
    '/rules': t.rules,
    '/settings': t.settings
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'hi', label: 'हिन्दी' }
  ];

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r bg-sidebar lg:flex">
        <div className="px-6 pb-7 pt-8">
          <Brand />
        </div>

        <div className="mx-4 rounded-xl border bg-card px-3 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold tracking-[.13em] text-muted-foreground">YOUR CIRCLE</span>
            <ChevronsUpDown size={13} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-xs font-semibold">{circle?.name ?? 'Mahallu Qard Hasan'}</p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{circle?.mosque ?? 'Perinthalmanna Juma Masjid'}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Active circle
          </div>
        </div>

        <div className="mt-6 px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDemoTourOpen(true)}
            className="w-full gap-2 border-gold/40 bg-gold-soft/50 text-xs font-medium text-gold-foreground hover:bg-gold-soft"
          >
            <Sparkles size={14} className="text-gold" />
            {t.quickDemoTour}
          </Button>
        </div>

        <div className="mt-6 px-8 text-[9px] font-semibold tracking-[.14em] text-muted-foreground">COMMUNITY</div>
        <nav aria-label="Main navigation" className="mt-3 space-y-1 px-4">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="ghost" className="sidebar-link relative" data-active={pathname === to}>
              <Link to={to}>
                <Icon className="mr-1" size={18} />
                {label}
              </Link>
            </Button>
          ))}
          {role === 'Committee Admin' && (
            <Button
              asChild
              variant="ghost"
              className="sidebar-link relative"
              data-active={pathname === '/committee'}
            >
              <Link to="/committee">
                <ShieldCheck className="mr-1" />
                {t.committee}
                <span className="ml-auto flex size-5 items-center justify-center rounded-md bg-gold-soft text-[10px] text-gold-foreground">
                  2
                </span>
              </Link>
            </Button>
          )}
        </nav>

        <div className="my-5 mx-7 border-t" />
        <nav aria-label="Circle preferences" className="space-y-1 px-4">
          <Button asChild variant="ghost" className="sidebar-link relative" data-active={pathname === '/rules'}>
            <Link to="/rules">
              <Leaf className="mr-1" />
              {t.rules}
            </Link>
          </Button>
          <Button asChild variant="ghost" className="sidebar-link relative" data-active={pathname === '/settings'}>
            <Link to="/settings">
              <Settings className="mr-1" />
              {t.settings}
            </Link>
          </Button>
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-gold/25 bg-gold-soft/50 px-4 py-4">
            <div className="flex items-center gap-2 text-gold-foreground">
              <Leaf size={16} />
              <span className="font-display text-sm">Built on barakah.</span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              {t.tagline}
            </p>
            <Button asChild variant="link" className="mt-1 h-6 p-0 text-[10px]">
              <Link to="/rules">
                Our guiding principles <ArrowUpRight size={12} />
              </Link>
            </Button>
          </div>

          <Button variant="ghost" onClick={() => setHelp(true)} className="sidebar-link mt-3">
            <CircleHelp />
            Help & support
          </Button>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                {user?.initials ?? 'AK'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user?.name ?? 'Abdul Kareem'}</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">{role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Switch demo profile"
                aria-label="Switch demo profile"
                className="size-7"
                onClick={() => setSwitchOpen(true)}
              >
                <LogOut size={14} />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:ml-[232px]">
        <header className="flex h-[76px] items-center justify-between border-b bg-card px-5 sm:px-8">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span>My circles</span>
            <span className="mx-1 text-border">/</span>
            <span className="text-foreground">{pageTitles[pathname] ?? t.circleOverview}</span>
          </div>
          <div className="sm:hidden">
            <Brand compact />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Demo Tour Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDemoTourOpen(true)}
              className="hidden gap-1.5 border-gold/40 bg-gold-soft/60 text-[11px] font-medium text-gold-foreground hover:bg-gold-soft sm:flex"
            >
              <Sparkles size={13} className="text-gold" />
              {t.quickDemoTour}
            </Button>

            {/* Language Switcher */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Change language" title="Language" className="size-8 text-muted-foreground">
                  <Globe size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[140px] p-1.5">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">Language</p>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                      language === l.code ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-secondary'
                    }`}
                  >
                    <span>{l.label}</span>
                    {language === l.code && <Check size={14} />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Theme Switcher */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={dark ? 'Light theme' : 'Dark theme'}
              onClick={toggleTheme}
              className="size-8 text-muted-foreground"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            {/* Notifications */}
            <Popover open={notifications} onOpenChange={setNotifications}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Notifications" aria-label="Notifications" className="relative size-8 text-muted-foreground">
                  <Bell size={16} />
                  {!read && <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-gold" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[310px] rounded-xl p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="font-display">Notifications</h2>
                  <Button variant="link" className="h-auto p-0 text-[10px]" onClick={() => setRead(true)}>
                    Mark all read
                  </Button>
                </div>
                {[
                  { title: 'A little support goes a long way', body: 'Two loan requests await committee review.' },
                  { title: 'Your circle is growing', body: 'All 12 members are active in the circle.' },
                  { title: 'October installment reminder', body: 'Your next installment is due on 15 October.' }
                ]
                  .filter((_, i) => (role === 'Committee Admin' ? i < 2 : i > 0))
                  .map((n) => (
                    <div key={n.title} className="border-b px-4 py-4">
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{n.body}</p>
                    </div>
                  ))}
                {read && <p className="p-3 text-center text-[10px] text-primary">All caught up</p>}
              </PopoverContent>
            </Popover>

            <div className="hidden h-6 border-l sm:block" />

            <Button asChild variant="ghost" className="h-auto gap-2 rounded-full p-0">
              <Link to="/settings" aria-label="Your profile">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                  {user?.initials ?? 'AK'}
                </span>
                <ChevronDown size={13} className="hidden text-muted-foreground sm:block" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1460px] px-5 pb-28 pt-7 sm:px-8 sm:pt-8 lg:pb-14">
          {children}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} />
              A community of trust. A ledger of transparency.
            </span>
            <span>Prototype · Simulated Shariah-compliant pool</span>
          </footer>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {navigation.map(({ to, label, icon: Icon }) => (
          <Button
            asChild
            variant="ghost"
            key={to}
            className={`h-16 flex-col gap-1 rounded-none px-1 text-[9px] ${
              pathname === to ? 'text-primary bg-secondary/60' : 'text-muted-foreground'
            }`}
          >
            <Link to={to}>
              <Icon size={20} />
              {label === 'Transparent ledger' ? 'Ledger' : label}
            </Link>
          </Button>
        ))}
      </nav>

      {/* Demo Persona Switcher */}
      <Popover open={switchOpen} onOpenChange={setSwitchOpen}>
        <PopoverTrigger asChild>
          <Button className="demo-switcher fixed bottom-20 right-5 z-50 h-11 gap-2 rounded-full border border-gold/35 bg-card px-4 text-foreground shadow-lg hover:bg-secondary lg:bottom-6 lg:right-7">
            <ArrowLeftRight size={15} className="text-primary" />
            <span className="text-xs">{t.demoRole}</span>
            <span className="hidden border-l pl-2 text-[11px] text-muted-foreground sm:inline">{role}</span>
            <ChevronDown size={13} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="mb-2 w-[300px] rounded-2xl p-2">
          <div className="px-3 py-3">
            <span className="text-[10px] font-semibold tracking-[.1em] text-muted-foreground">EXPLORE THE CIRCLE</span>
            <h2 className="mt-1 font-display text-lg">A different perspective</h2>
          </div>
          {roles.map((r) => (
            <Button
              variant="ghost"
              key={r}
              onClick={() => {
                switchRole(r);
                setSwitchOpen(false);
              }}
              className="h-auto w-full justify-start rounded-lg px-3 py-3"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
                {r === 'Committee Admin' ? (
                  <ShieldCheck size={18} />
                ) : r === 'Member' ? (
                  <Users size={18} />
                ) : r === 'Guarantor' ? (
                  <HeartHandshake size={18} />
                ) : (
                  <BookOpen size={18} />
                )}
              </span>
              <span className="text-left">
                <span className="block text-xs">{r}</span>
                <span className="mt-1 block text-[10px] font-normal text-muted-foreground">{roleDescriptions[r]}</span>
              </span>
              {r === role && <Check className="ml-auto text-primary" size={16} />}
            </Button>
          ))}
          <p className="px-3 pb-2 pt-3 text-[10px] text-muted-foreground">Demo profiles only. No real funds are moved.</p>
        </PopoverContent>
      </Popover>

      {/* Help Modal */}
      {help && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-5 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="help-title" className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="help-title" className="font-display text-xl">Your community, here for you</h2>
              <Button variant="ghost" size="icon" aria-label="Close help" onClick={() => setHelp(false)}>
                <X size={16} />
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              For questions about contributions or repayment, please speak with the committee at Perinthalmanna Juma Masjid.
            </p>
            <Button className="mt-5 w-full" onClick={() => setHelp(false)}>
              Understood
            </Button>
          </div>
        </div>
      )}

      {/* 5-Min Demo Tour Modal */}
      <DemoTourModal isOpen={demoTourOpen} onClose={() => setDemoTourOpen(false)} />
    </div>
  );
}
