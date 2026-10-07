import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService, circleService, seedFirestore } from '@/lib/services';
import { ensureFirestoreInitialized } from '@/lib/services/firestoreAdapter';
import type { Circle, Role, User } from '@/lib/types';

interface DemoContextValue {
  user: User | null;
  isAuthenticated: boolean;
  circle: Circle | null;
  role: Role;
  switchRole: (role: Role) => void;
  dark: boolean;
  toggleTheme: () => void;
  isFirebaseUser: boolean;
  isDemoUser: boolean;
  isLoadingAuth: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: Role) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signInAsDemo: (role: Role) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncWithFirestore: (force?: boolean) => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
  switchCircle: (circleId: string) => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);
const roles: Role[] = ['Super Admin', 'Committee Admin', 'Member', 'Guarantor', 'Auditor'];

const AUTH_STORAGE_KEY = 'qard-demo-auth-session';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Member');
  const [user, setUser] = useState<User | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Initialize DB and restore theme/preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('qard-theme');
      if (savedTheme) setDark(savedTheme === 'dark');

      const savedPref = JSON.parse(localStorage.getItem('qard-demo') ?? '{}');
      if (roles.includes(savedPref.role)) setRole(savedPref.role);
    } catch {
      // Ignore parse errors
    }
    setReady(true);
    ensureFirestoreInitialized();
    circleService.getActive().then(setCircle).catch(() => {});
  }, []);

  // Listen to Firebase Auth state changes & restore demo session if no Firebase user
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth(async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setRole(fbUser.role);
        setIsFirebaseUser(true);
        setIsDemoUser(false);
        setIsLoadingAuth(false);
      } else {
        setIsFirebaseUser(false);
        // Check if user had an active demo persona session
        try {
          const savedDemo = localStorage.getItem(AUTH_STORAGE_KEY);
          if (savedDemo && roles.includes(savedDemo as Role)) {
            const demoPersona = await authService.getDemoUser(savedDemo as Role);
            setUser(demoPersona);
            setRole(demoPersona.role);
            setIsDemoUser(true);
          } else {
            setUser(null);
            setIsDemoUser(false);
          }
        } catch {
          setUser(null);
          setIsDemoUser(false);
        }
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync dark theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
    }
    if (ready && typeof localStorage !== 'undefined') {
      localStorage.setItem('qard-theme', dark ? 'dark' : 'light');
    }
  }, [dark, ready]);

  const handleSignInWithEmail = async (email: string, pass: string) => {
    const loggedInUser = await authService.signInWithEmail(email, pass);
    setUser(loggedInUser);
    setRole(loggedInUser.role);
    setIsFirebaseUser(true);
    setIsDemoUser(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    return loggedInUser;
  };

  const handleSignUpWithEmail = async (email: string, pass: string, name: string, roleParam: Role = 'Member') => {
    const newUser = await authService.signUpWithEmail(email, pass, name, roleParam);
    setUser(newUser);
    setRole(newUser.role);
    setIsFirebaseUser(true);
    setIsDemoUser(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    return newUser;
  };

  const handleSignInWithGoogle = async () => {
    const loggedInUser = await authService.signInWithGoogle();
    setUser(loggedInUser);
    setRole(loggedInUser.role);
    setIsFirebaseUser(true);
    setIsDemoUser(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    return loggedInUser;
  };

  const handleSignInAsDemo = async (demoRole: Role) => {
    const demo = await authService.getDemoUser(demoRole);
    setUser(demo);
    setRole(demo.role);
    setIsDemoUser(true);
    setIsFirebaseUser(false);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, demoRole);
    } catch {}
    return demo;
  };

  const handleSignOut = async () => {
    if (isFirebaseUser) {
      await authService.signOut();
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    setIsFirebaseUser(false);
    setIsDemoUser(false);
    setUser(null);
  };

  const handleSwitchRole = (newRole: Role) => {
    if (isFirebaseUser) {
      handleSignOut();
    }
    handleSignInAsDemo(newRole);
  };

  const syncWithFirestore = async (force = false) => {
    const res = await seedFirestore(force);
    const updatedCircle = await circleService.getActive();
    setCircle(updatedCircle);
    return res;
  };

  const refreshData = async () => {
    const updatedCircle = await circleService.getActive();
    setCircle(updatedCircle);
  };

  const handleSwitchCircle = async (circleId: string) => {
    try {
      const selected = await circleService.getCircleById(circleId);
      setCircle(selected);
    } catch (err) {
      console.warn('Switch circle error:', err);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        circle,
        role,
        switchRole: handleSwitchRole,
        dark,
        toggleTheme: () => setDark((v) => !v),
        isFirebaseUser,
        isDemoUser,
        isLoadingAuth,
        authModalOpen,
        setAuthModalOpen,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithGoogle: handleSignInWithGoogle,
        signInAsDemo: handleSignInAsDemo,
        resetPassword: (email: string) => authService.resetPassword(email),
        signOut: handleSignOut,
        syncWithFirestore,
        refreshData,
        switchCircle: handleSwitchCircle
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('DemoProvider required');
  return context;
}

