import { useState } from 'react';
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import {
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  LogOut,
  KeyRound,
  CheckCircle2,
  Crown,
  BookOpen,
  Users,
  Building2,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemo } from '@/lib/demo-context';
import { circleHead } from '@/lib/route-head';
import type { Role } from '@/lib/types';
import { toast } from 'sonner';

function AuthPageComponent() {
  const {
    user,
    isAuthenticated,
    isFirebaseUser,
    isDemoUser,
    role,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsDemo,
    resetPassword,
    signOut,
    dark,
    toggleTheme
  } = useDemo();

  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'signup' | 'demo' | 'reset'>('signin');
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Member');
  const [showPassword, setShowPassword] = useState(false);

  const navigateToDashboard = () => {
    router.navigate({ to: '/dashboard' });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await signInWithEmail(email, password);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      navigateToDashboard();
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password. Please check and try again.'
          : err.code === 'auth/user-not-found'
          ? 'No account found with this email. Would you like to register?'
          : err.message || 'Failed to sign in.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!email || !password) {
      toast.error('Please enter a valid email and password.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await signUpWithEmail(email, password, name, selectedRole);
      toast.success(`Account created! Welcome to Mahallu Circle, ${newUser.name}.`);
      navigateToDashboard();
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists. Please sign in.'
          : err.message || 'Failed to register account.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const loggedUser = await signInWithGoogle();
      toast.success(`Signed in as ${loggedUser.name} with Google!`);
      navigateToDashboard();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoRole: Role) => {
    setLoading(true);
    try {
      const persona = await signInAsDemo(demoRole);
      toast.success(`Entered circle as ${persona.name} (${demoRole})`);
      navigateToDashboard();
    } catch {
      toast.error('Could not load demo persona');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email to receive password reset instructions.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset link sent to your email!', {
        description: 'Please check your inbox or spam folder.'
      });
      setTab('signin');
    } catch (err: any) {
      toast.error(err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <HeartHandshake size={20} strokeWidth={1.8} />
            </span>
            <span className="font-display text-lg font-bold">
              Qard Hasan <span className="font-sans text-[10px] tracking-widest text-muted-foreground uppercase">Circles</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Public Home
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-8 text-muted-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Active User Card (if already logged in) */}
          {isAuthenticated && user ? (
            <div className="rounded-3xl border border-primary/30 bg-card p-7 shadow-xl shadow-primary/5 space-y-6 animate-in fade-in-0">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md">
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-xl font-bold text-foreground">{user.name}</h2>
                    <span className="rounded-md bg-primary/15 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {user.role}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>{isFirebaseUser ? 'Authenticated via Firebase Auth' : 'Active Demo Persona Session'}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-4 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Circle:</span>
                  <span className="font-semibold text-foreground">Mahallu Qard Hasan Circle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mosque / Mahallu:</span>
                  <span className="font-semibold text-foreground">Perinthalmanna Juma Masjid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Privilege:</span>
                  <span className="font-bold text-primary">{role}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={navigateToDashboard}
                  className="flex-1 gap-2 rounded-xl py-5 font-bold shadow-md shadow-primary/20"
                >
                  <span>Go to Circle Dashboard</span>
                  <ArrowRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await signOut();
                    toast.info('Signed out successfully.');
                  }}
                  className="gap-2 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30 font-semibold"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-muted/50">
              {/* Header Title */}
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                  <ShieldCheck size={26} />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {tab === 'signin'
                    ? 'Sign In to Circle'
                    : tab === 'signup'
                    ? 'Join Mahallu Circle'
                    : tab === 'demo'
                    ? 'Quick Evaluation Access'
                    : 'Reset Your Password'}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Interest-free community lending & mutual care network
                </p>
              </div>

              {/* Tab Navigation */}
              {tab !== 'reset' && (
                <div className="flex rounded-2xl bg-muted p-1 border mb-6">
                  <button
                    type="button"
                    onClick={() => setTab('signin')}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                      tab === 'signin'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('signup')}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                      tab === 'signup'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('demo')}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      tab === 'demo'
                        ? 'bg-card text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles size={12} />
                    <span>Demo</span>
                  </button>
                </div>
              )}

              {/* Tab: Sign In */}
              {tab === 'signin' && (
                <div className="space-y-4">
                  {/* Super Admin Quick Login Chip */}
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-[11px]">
                        <Crown size={14} className="text-amber-500" />
                        Super Admin Credentials
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        <strong className="text-foreground">qard@gmail.com</strong> · Password: <strong className="text-foreground">123456</strong>
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEmail('qard@gmail.com');
                        setPassword('123456');
                        toast.success('Super Admin credentials filled! Click Sign In.');
                      }}
                      className="rounded-xl border-amber-500/40 bg-card text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                    >
                      Fill Credentials
                    </Button>
                  </div>

                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border bg-background py-2.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    <svg className="size-4.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <span className="relative bg-card px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Or with email
                    </span>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Email Address</label>
                      <div className="relative mt-1">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          placeholder="name@mahallu.org"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 rounded-xl pl-10 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <label className="text-foreground">Password</label>
                        <button
                          type="button"
                          onClick={() => setTab('reset')}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 rounded-xl pl-10 pr-10 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl py-6 font-bold text-xs gap-2 shadow-md shadow-primary/20"
                    >
                      <LogIn size={16} />
                      <span>{loading ? 'Signing in...' : 'Sign In to Circle'}</span>
                    </Button>
                  </form>
                </div>
              )}

              {/* Tab: Register / Join */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <div className="relative mt-1">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Rahim Mohammed"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10.5 rounded-xl pl-10 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="name@mahallu.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10.5 rounded-xl pl-10 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Password (min 6 characters)</label>
                    <div className="relative mt-1">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10.5 rounded-xl pl-10 pr-10 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Role in Circle</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Member">Member (Contribute & Borrow)</option>
                      <option value="Guarantor">Guarantor (Vouch for Members)</option>
                      <option value="Auditor">Auditor (Independent Reviewer)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-6 font-bold text-xs gap-2 shadow-md shadow-primary/20 mt-2"
                  >
                    <UserPlus size={16} />
                    <span>{loading ? 'Creating Account...' : 'Register & Join Circle'}</span>
                  </Button>
                </form>
              )}

              {/* Tab: Quick Demo Access */}
              {tab === 'demo' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gold/30 bg-gold-soft/50 p-3.5 text-xs">
                    <p className="font-semibold text-gold-foreground flex items-center gap-1.5">
                      <Sparkles size={14} className="text-gold" />
                      <span>Instant 1-Click Persona Access</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Pick any role below to enter the circle immediately without entering passwords:
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        r: 'Committee Admin' as Role,
                        name: 'Abdul Kareem',
                        desc: 'Approve loans, disburse funds, manage ledger',
                        icon: ShieldCheck
                      },
                      {
                        r: 'Member' as Role,
                        name: 'Rahim Mohammed',
                        desc: 'Request loans, pay installments, view wealth share',
                        icon: Users
                      },
                      {
                        r: 'Guarantor' as Role,
                        name: 'Yusuf Ali',
                        desc: 'Review and vouch for member loan requests',
                        icon: HeartHandshake
                      },
                      {
                        r: 'Super Admin' as Role,
                        name: 'Abdul Kareem (Super)',
                        desc: 'Full administrative access & settings',
                        icon: Crown
                      },
                      {
                        r: 'Auditor' as Role,
                        name: 'Rashid Usman',
                        desc: 'Cryptographic ledger audit & verification',
                        icon: BookOpen
                      }
                    ].map(({ r, name, desc, icon: Icon }) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleDemoSelect(r)}
                        disabled={loading}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-3 text-left hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon size={18} />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{name}</p>
                            <p className="text-[10px] text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                        <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-primary">
                          {r}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Reset Password */}
              {tab === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter your email address below and we will send you a link to reset your password.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="name@mahallu.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl pl-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTab('signin')}
                      className="flex-1 rounded-xl font-semibold"
                    >
                      Back to Sign In
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl font-bold gap-2"
                    >
                      <KeyRound size={15} />
                      <span>{loading ? 'Sending...' : 'Send Link'}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Qard Hasan Mahallu Protocol · Shariah-compliant 0% Interest Lending</span>
          <Link to="/" className="text-primary hover:underline font-semibold">
            ← Return to Public Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute('/auth')({
  head: () =>
    circleHead(
      'Sign In / Join Circle',
      'Authenticate with Firebase or Google to access your Mahallu Qard Hasan Circle.'
    ),
  component: AuthPageComponent
});

