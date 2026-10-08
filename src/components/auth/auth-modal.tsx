import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
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
  CheckCircle2,
  Crown,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemo } from '@/lib/demo-context';
import { circleService } from '@/lib/services';
import type { Role } from '@/lib/types';
import { toast } from 'sonner';
import logoImg from '@/assets/logo.png';

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

  const { data: allCircles = [] } = useQuery({
    queryKey: ['allCircles'],
    queryFn: () => circleService.getAllCircles()
  });

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup' | 'reset'>(initialTab);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Member');
  const [selectedCircleId, setSelectedCircleId] = useState('mahallu');
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
      const newUser = await signUpWithEmail(email, password, name, selectedRole, selectedCircleId);
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      {/* Crisp White Theme Modal Card */}
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col rounded-3xl border border-zinc-200/80 bg-white text-zinc-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 border border-zinc-200/80 shadow-xs">
              <img src={logoImg} alt="Qard Hasan" className="size-full object-contain" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900">
                {isFirebaseUser
                  ? 'Your Account'
                  : tab === 'signin'
                  ? 'Sign In to Circle'
                  : tab === 'signup'
                  ? 'Join Qard Hasan Circle'
                  : 'Reset Password'}
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                {isFirebaseUser
                  ? 'Authenticated Firebase Session'
                  : 'Interest-free community lending network'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* If already signed in with Firebase user */}
        {isFirebaseUser ? (
          <div className="flex flex-col overflow-y-auto px-6 py-6 space-y-5 bg-white">
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-700 text-base font-bold text-white shadow-sm">
                {user?.initials || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-bold text-zinc-900">{user?.name}</h3>
                  <span className="rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {user?.role}
                  </span>
                </div>
                <p className="truncate text-xs text-zinc-500 font-medium mt-0.5">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={13} />
                  <span>Authenticated with Firebase</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">User ID</span>
                <span className="font-mono text-[11px] font-semibold text-zinc-800">{user?.id.slice(0, 14)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Active Mahallu Circle</span>
                <span className="font-semibold text-zinc-900">Mahallu Qard Hasan Circle</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Permission Level</span>
                <span className="font-bold text-emerald-700">{role} Access</span>
              </div>
            </div>

            <Button
              onClick={async () => {
                await signOut();
                toast.info('Signed out. Reverted to demo mode.');
              }}
              variant="outline"
              className="gap-2 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
            >
              <LogOut size={16} />
              Sign Out of Account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto px-6 py-5 space-y-4 bg-white">
            {/* Clean Segmented Tabs */}
            {tab !== 'reset' && (
              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/60">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                    tab === 'signin'
                      ? 'bg-white text-emerald-900 shadow-sm border border-zinc-200/50'
                      : 'text-zinc-500 hover:text-zinc-900 font-medium'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                    tab === 'signup'
                      ? 'bg-white text-emerald-900 shadow-sm border border-zinc-200/50'
                      : 'text-zinc-500 hover:text-zinc-900 font-medium'
                  }`}
                >
                  Join Circle
                </button>
              </div>
            )}

            {/* Google One-Click Button */}
            {tab !== 'reset' && (
              <div>
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer"
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
                  <span>{tab === 'signin' ? 'Continue with Google' : 'Sign Up with Google'}</span>
                </button>

                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    Or with email
                  </span>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                {/* Super Admin Quick Login Chip */}
                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                      <Crown size={14} className="text-amber-600" />
                      Super Admin Credentials
                    </span>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      <strong className="text-zinc-900">qard@gmail.com</strong> · Pass: <strong className="text-zinc-900">123456</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('qard@gmail.com');
                      setPassword('123456');
                      toast.success('Super Admin credentials filled! Click Sign In.');
                    }}
                    className="rounded-xl border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-xs hover:bg-amber-100 cursor-pointer"
                  >
                    Fill
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      placeholder="name@mahallu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10.5 rounded-xl border-zinc-200 bg-zinc-50/70 pl-9.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <label className="text-zinc-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setTab('reset')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10.5 rounded-xl border-zinc-200 bg-zinc-50/70 pl-9.5 pr-9.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogIn size={16} />
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                  <div className="relative mt-1">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Rahim Mohammed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded-xl border-zinc-200 bg-zinc-50/70 pl-9.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      placeholder="name@mahallu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-xl border-zinc-200 bg-zinc-50/70 pl-9.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700">Create Password</label>
                  <div className="relative mt-1">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 rounded-xl border-zinc-200 bg-zinc-50/70 pl-9.5 pr-9.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Role in Circle</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="Member">Member (Saver / Borrower)</option>
                      <option value="Guarantor">Guarantor (Voucher)</option>
                      <option value="Auditor">Auditor (Independent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Mahallu Invite Code</label>
                    <Input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="mt-1 h-9 rounded-xl border-zinc-200 bg-zinc-50/70 text-xs font-mono font-bold uppercase text-zinc-900 focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                    <Building2 size={13} className="text-emerald-700" />
                    <span>Select Mahallu / Mosque</span>
                  </label>
                  <select
                    value={selectedCircleId}
                    onChange={(e) => setSelectedCircleId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {allCircles && allCircles.length > 0 ? (
                      allCircles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.location ? `(${c.location})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="mahallu">Mahallu Qard Hasan Circle (Perinthalmanna Juma Masjid)</option>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  <span>{loading ? 'Creating Account...' : 'Create Account & Join'}</span>
                </button>
              </form>
            )}

            {/* Password Reset Form */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Enter your registered email address below and we'll send you instructions to reset your password.
                </p>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Email Address</label>
                  <div className="relative mt-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      placeholder="name@mahallu.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10.5 rounded-xl border-zinc-200 bg-zinc-50/70 pl-9.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTab('signin')}
                    className="flex-1 rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-semibold"
                  >
                    Back to Sign In
                  </Button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-800 transition-all cursor-pointer"
                  >
                    <KeyRound size={15} />
                    <span>{loading ? 'Sending...' : 'Send Link'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Instant Demo Switcher Box (Clean Light Palette) */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles size={14} className="text-amber-600" />
                <span>Instant Demo Access (No password required)</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800/80 font-medium">
                Select a pre-configured persona to test workflows immediately:
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {[
                  { r: 'Super Admin' as Role, name: 'Super Admin', tag: 'Super' },
                  { r: 'Committee Admin' as Role, name: 'Abdul Kareem', tag: 'Admin' },
                  { r: 'Member' as Role, name: 'Rahim Mohammed', tag: 'Member' },
                  { r: 'Guarantor' as Role, name: 'Yusuf Ali', tag: 'Guarantor' },
                  { r: 'Auditor' as Role, name: 'Rashid Usman', tag: 'Auditor' }
                ].map(({ r, name, tag }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickDemo(r)}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white px-3 py-2 text-left text-[11px] font-semibold text-zinc-800 shadow-xs hover:bg-amber-100/60 hover:border-amber-300 transition-all cursor-pointer"
                  >
                    <span className="truncate">{name}</span>
                    <span className="text-[10px] font-bold text-emerald-700">{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50 px-6 py-3.5">
          <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-700" />
            100% Zero-Interest Shariah Protocol
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 px-2.5 py-1 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
