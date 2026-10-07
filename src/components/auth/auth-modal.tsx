import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  X,
  ArrowRight,
  LogOut,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemo } from '@/lib/demo-context';
import type { Role } from '@/lib/types';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const {
    user,
    role,
    isFirebaseUser,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    signOut,
    switchRole
  } = useDemo();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup' | 'reset'>(initialTab);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Member');
  const [inviteCode, setInviteCode] = useState('MAHALLU-2026');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

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
      onClose();
    } catch (err: any) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password. Please check and try again.'
          : err.code === 'auth/user-not-found'
          ? 'No account found with this email. Would you like to sign up?'
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
      toast.error('Please enter a valid email and password (minimum 6 characters).');
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
      onClose();
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
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address to receive reset instructions.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset link sent to your email!', {
        description: 'Check your inbox or spam folder.'
      });
      setTab('signin');
    } catch (err: any) {
      toast.error(err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: Role) => {
    switchRole(demoRole);
    toast.info(`Switched to demo profile: ${demoRole}`);
    onClose();
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in-0 duration-200"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl border border-emerald-500/30 bg-[#16221c] text-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {isFirebaseUser
                  ? 'Your Account'
                  : tab === 'signin'
                  ? 'Sign In to Circle'
                  : tab === 'signup'
                  ? 'Join Qard Hasan Circle'
                  : 'Reset Password'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {isFirebaseUser
                  ? 'Authenticated Firebase Session'
                  : 'Interest-free community lending network'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal"
            className="size-8 rounded-lg hover:bg-muted/50"
          >
            <X size={18} />
          </Button>
        </div>

        {/* If already signed in with Firebase user */}
        {isFirebaseUser ? (
          <div className="flex flex-col overflow-y-auto px-6 py-6 space-y-5">
            <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {user?.initials || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-foreground">{user?.name}</h3>
                  <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {user?.role}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <CheckCircle2 size={12} />
                  <span>Authenticated with Firebase</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-[11px] text-foreground">{user?.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Mahallu Circle</span>
                <span className="font-medium text-foreground">Mahallu Qard Hasan Circle</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permission Level</span>
                <span className="font-medium text-primary">{role} Access</span>
              </div>
            </div>

            <Button
              onClick={async () => {
                await signOut();
                toast.info('Signed out. Reverted to demo mode.');
              }}
              variant="outline"
              className="gap-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={16} />
              Sign Out of Account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto px-6 py-5 space-y-4">
            {/* Tabs */}
            {tab !== 'reset' && (
              <div className="flex rounded-xl bg-background/60 p-1 border border-border/60">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    tab === 'signin'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    tab === 'signup'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Join Circle
                </button>
              </div>
            )}

            {/* Google One-Click Button */}
            {tab !== 'reset' && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full gap-2.5 rounded-xl border-border/80 bg-background/80 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  <svg className="size-4" viewBox="0 0 24 24">
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
                  {tab === 'signin' ? 'Continue with Google' : 'Sign Up with Google'}
                </Button>

                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <span className="relative bg-[#16221c] px-3 text-[10px] uppercase font-semibold text-muted-foreground">
                    Or with email
                  </span>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="name@mahallu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl border-border/80 bg-background/90 pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium">
                    <label className="text-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => setTab('reset')}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 rounded-xl border-border/80 bg-background/90 pl-9 pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                >
                  <LogIn size={16} />
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* Sign Up Form */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Full Name</label>
                  <div className="relative mt-1">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Rahim Mohammed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded-xl border-border/80 bg-background/90 pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="name@mahallu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl border-border/80 bg-background/90 pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">Create Password</label>
                  <div className="relative mt-1">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 rounded-xl border-border/80 bg-background/90 pl-9 pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">Role in Circle</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="mt-1 block w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-xs font-medium text-foreground"
                    >
                      <option value="Member">Member (Saver / Borrower)</option>
                      <option value="Guarantor">Guarantor (Voucher)</option>
                      <option value="Auditor">Auditor (Independent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">Mahallu Invite Code</label>
                    <Input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="mt-1 h-9 rounded-xl border-border/80 bg-background/90 text-xs font-mono font-semibold uppercase"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                >
                  <UserPlus size={16} />
                  {loading ? 'Creating Account...' : 'Create Account & Join'}
                </Button>
              </form>
            )}

            {/* Password Reset Form */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your registered email address below and we'll send you instructions to reset your password.
                </p>
                <div>
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="name@mahallu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl border-border/80 bg-background/90 pl-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTab('signin')}
                    className="flex-1 rounded-xl"
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <KeyRound size={15} />
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}

            {/* Quick Demo Switcher Section */}
            <div className="rounded-xl border border-gold/30 bg-gold-soft/30 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-foreground">
                <Sparkles size={14} className="text-gold" />
                <span>Instant Demo Access (No password required)</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Select a pre-configured persona to test workflows immediately:
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                {[
                  { r: 'Committee Admin' as Role, name: 'Abdul Kareem' },
                  { r: 'Member' as Role, name: 'Rahim Mohammed' },
                  { r: 'Guarantor' as Role, name: 'Yusuf Ali' },
                  { r: 'Auditor' as Role, name: 'Farooq Engineer' }
                ].map(({ r, name }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickDemo(r)}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-background/80 px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors hover:bg-secondary hover:border-primary/50"
                  >
                    <span className="truncate">{name}</span>
                    <span className="text-[9px] text-primary">{r.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/30 px-6 py-3.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck size={12} className="text-primary" />
            100% Zero-Interest Shariah Protocol
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
