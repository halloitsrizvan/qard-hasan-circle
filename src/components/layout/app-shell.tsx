import { useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Coins,
  Crown,
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
  ChevronsUpDown,
  LogIn,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { circleQueries } from '@/lib/services';
import { useDemo } from '@/lib/demo-context';
import { useI18n, type Language } from '@/lib/i18n';
import { DemoTourModal } from '@/components/circle/modals';
import { AuthModal } from '@/components/auth/auth-modal';
import type { Role, Circle } from '@/lib/types';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="group flex items-center gap-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-105">
        <img src={logoImg} alt="Qard Hasan Logo" className="size-full object-contain" />
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
  const {
    circle,
    user,
    role,
    dark,
    toggleTheme,
    switchRole,
    switchCircle,
    isFirebaseUser,
    isDemoUser,
    isAuthenticated,
    isLoadingAuth,
    signInAsDemo,
    signOut,
    authModalOpen,
    setAuthModalOpen
  } = useDemo();
  const { data: allCircles = [] } = useQuery({
    ...circleQueries.allCircles,
    enabled: role === 'Super Admin'
  });
  const [circleSwitchOpen, setCircleSwitchOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [notifications, setNotifications] = useState(false);
  const [read, setRead] = useState(false);
  const [help, setHelp] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);

  // If visiting public landing page or auth page, render without dashboard chrome
  if (pathname === '/' || pathname === '/welcome' || pathname === '/auth') {
    return (
      <>
        {children}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    );
  }

  // If checking authentication status, show elegant loading state
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 animate-pulse">
            <HeartHandshake size={28} />
          </div>
          <div>
            <p className="font-display text-lg font-bold">Mahallu Qard Hasan Circle</p>
            <p className="mt-1 text-xs text-muted-foreground animate-pulse">Verifying circle authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated user tries to access protected page, show Auth Gate
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/30 via-background to-background p-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in-0">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Authentication Required</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              This area is restricted to verified circle members and committee administrators. Please sign in or use demo access to proceed.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              asChild
              className="w-full rounded-xl py-5 font-bold shadow-md shadow-primary/20"
            >
              <Link to="/auth">
                <LogIn className="mr-2" size={16} />
                Sign In or Register
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => signInAsDemo('Committee Admin')}
              className="w-full rounded-xl py-5 border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 font-bold gap-2 hover:bg-amber-100/60 cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-500" />
              <span>Instant Demo Access (Admin)</span>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/">
                ← Return to Public Homepage
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }


  const navigation = [
    { to: '/dashboard' as const, label: t.circleOverview, icon: LayoutDashboard },
    { to: '/profile' as const, label: t.profile, icon: User },
    { to: '/wealth' as const, label: t.wealthAndChit, icon: Coins },
    { to: '/contributions' as const, label: t.contributions, icon: Wallet },
    { to: '/loans' as const, label: t.loans, icon: HandCoins },
    { to: '/ledger' as const, label: t.ledger, icon: BookOpen },
    { to: '/members' as const, label: t.members, icon: Users }
  ];

  const roles: Role[] = ['Super Admin', 'Committee Admin', 'Member', 'Guarantor', 'Auditor'];
  const roleDescriptions: Record<Role, string> = {
    'Super Admin': 'Full authority over all users, roles & circle settings',
    'Committee Admin': 'Manage your community circle',
    Member: 'Contribute and view your loans',
    Guarantor: 'Review the requests you guarantee',
    Auditor: 'Explore records in read-only mode'
  };

  const pageTitles: Record<string, string> = {
    '/dashboard': t.circleOverview,
    '/profile': t.profile,
    '/wealth': t.wealthAndChit,
    '/contributions': t.contributions,
    '/loans': t.loans,
    '/ledger': t.ledger,
    '/members': t.members,
    '/committee': t.committee,
    '/admin': 'Super Admin Hub',
    '/rules': t.rules,
    '/settings': t.settings,
    '/': 'Public Page',
    '/welcome': 'Public Page'
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'hi', label: 'हिन्दी' }
  ];

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r bg-sidebar lg:flex overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="px-6 pb-6 pt-7 shrink-0">
          <Brand />
        </div>

        {role === 'Super Admin' ? (
          <Popover open={circleSwitchOpen} onOpenChange={setCircleSwitchOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="mx-4 rounded-xl border bg-card px-3 py-3 text-left transition-all hover:border-primary/50 hover:bg-muted/40 cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold tracking-[.13em] text-primary">SWITCH MAHALL</span>
                  <ChevronsUpDown size={13} className="text-muted-foreground" />
                </div>
                <p className="mt-2 text-xs font-bold text-foreground">{circle?.name ?? 'Mahallu Qard Hasan'}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{circle?.mosque ?? 'Perinthalmanna Juma Masjid'}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-semibold">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>Active Context · Click to change</span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-[260px] p-2 rounded-2xl shadow-xl">
              <div className="px-2 py-1.5 border-b mb-1.5">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Federation Mahalls</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Select active circle for entire app</p>
              </div>
              <div className="space-y-1 max-h-[260px] overflow-y-auto">
                {allCircles.map((c) => {
                  const isActive = circle?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={async () => {
                        await switchCircle(c.id);
                        toast.success(`Switched active circle to: ${c.name}`);
                        setCircleSwitchOpen(false);
                      }}
                      className={`w-full rounded-xl p-2 text-left transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.mosque}</p>
                      </div>
                      {isActive && <Check size={14} className="text-primary mt-0.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
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
        )}

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
          {role === 'Super Admin' && (
            <Button
              asChild
              variant="ghost"
              className="sidebar-link relative border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold hover:bg-amber-500/20 mb-2"
              data-active={pathname === '/admin'}
            >
              <Link to="/admin">
                <Crown className="mr-1 text-amber-500" size={18} />
                <span>Super Admin</span>
                <span className="ml-auto rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                  HUB
                </span>
              </Link>
            </Button>
          )}

          {navigation.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="ghost" className="sidebar-link relative" data-active={pathname === to}>
              <Link to={to}>
                <Icon className="mr-1" size={18} />
                {label}
              </Link>
            </Button>
          ))}
          {(role === 'Super Admin' || role === 'Committee Admin') && (
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

        <div className="my-4 mx-7 border-t" />
        <nav aria-label="Circle preferences" className="space-y-1 px-4">
          <Button asChild variant="ghost" className="sidebar-link relative" data-active={pathname === '/' || pathname === '/welcome'}>
            <Link to="/">
              <Globe className="mr-1" />
              Public Page
            </Link>
          </Button>
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
              <Link
                to="/profile"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary transition-transform hover:scale-105"
                title="View My Profile"
              >
                {user?.initials ?? 'AK'}
              </Link>
              <Link to="/profile" className="min-w-0 flex-1 group">
                <p className="truncate text-xs font-medium group-hover:text-primary transition-colors">
                  {user?.name ?? 'Abdul Kareem'}
                </p>
                <div className="flex items-center gap-1">
                  <p className="truncate text-[9px] text-muted-foreground">{role}</p>
                  {isFirebaseUser && (
                    <span className="size-1.5 rounded-full bg-emerald-500" title="Firebase User" />
                  )}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                title={isFirebaseUser ? 'Account Settings' : 'Switch demo profile'}
                aria-label="Account Settings"
                className="size-7"
                onClick={() => (isFirebaseUser ? setAuthModalOpen(true) : setSwitchOpen(true))}
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

            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              title="View My Member Profile"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {user?.initials ?? 'U'}
              </span>
              <span className="hidden sm:inline font-medium">{user?.name?.split(' ')[0]}</span>
            </Link>
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
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {navigation.map(({ to, label, icon: Icon }) => (
          <Button
            asChild
            variant="ghost"
            key={to}
            className={`h-16 flex-col gap-1 rounded-none px-1 text-[8px] sm:text-[9px] ${
              pathname === to ? 'text-primary bg-secondary/60 font-bold' : 'text-muted-foreground'
            }`}
          >
            <Link to={to}>
              <Icon size={18} />
              <span className="truncate max-w-[48px]">{label === 'Transparent ledger' ? 'Ledger' : label === 'Circle Overview' ? 'Overview' : label === 'Wealth & Chit Fund' ? 'Wealth' : label}</span>
            </Link>
          </Button>
        ))}
      </nav>

      {/* Demo Persona Switcher */}
      <Popover open={switchOpen} onOpenChange={setSwitchOpen}>
        <PopoverTrigger asChild>
          <Button className="demo-switcher fixed bottom-20 right-5 z-40 h-11 gap-2 rounded-full border border-gold/35 bg-card px-4 text-foreground shadow-lg hover:bg-secondary lg:bottom-6 lg:right-7">
            <ArrowLeftRight size={15} className="text-primary" />
            <span className="text-xs">{t.demoRole}</span>
            <span className="hidden border-l pl-2 text-[11px] text-muted-foreground sm:inline">{role}</span>
            <ChevronDown size={13} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="mb-2 w-[300px] rounded-2xl p-2 z-40">
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
                {r === 'Super Admin' ? (
                  <Crown size={18} className="text-amber-500" />
                ) : r === 'Committee Admin' ? (
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
        <div
          onClick={(e) => e.target === e.currentTarget && setHelp(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-xs animate-in fade-in-0"
        >
          <div role="dialog" aria-modal="true" aria-labelledby="help-title" className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95">
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

      {/* Global Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
