import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService, circleService, seedFirestore } from '@/lib/services';
import type { Circle, Role, User } from '@/lib/types';

interface DemoContextValue {
  user: User | null;
  circle: Circle | null;
  role: Role;
  switchRole: (role: Role) => void;
  dark: boolean;
  toggleTheme: () => void;
  isFirebaseUser: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: Role) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncWithFirestore: (force?: boolean) => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);
const roles: Role[] = ['Committee Admin', 'Member', 'Guarantor', 'Auditor'];

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Committee Admin');
  const [user, setUser] = useState<User | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Restore local demo preferences after hydration to prevent SSR mismatches
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qard-demo') ?? '{}');
      if (roles.includes(saved.role)) setRole(saved.role);
      setDark(saved.dark === true);
    } catch {
      // Ignore parse errors
    }
    setReady(true);
    circleService.getActive().then(setCircle);
  }, []);

  // Subscribe to real-time Firebase Auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setRole(fbUser.role);
        setIsFirebaseUser(true);
      } else {
        setIsFirebaseUser(false);
        authService.getDemoUser(role).then(setUser);
      }
    });
    return () => unsubscribe();
  }, [role]);

  // Load demo persona when not authenticated via custom Firebase user
  useEffect(() => {
    if (!isFirebaseUser) {
      let current = true;
      authService.getDemoUser(role).then((u) => {
        if (current) setUser(u);
      });
      return () => {
        current = false;
      };
    }
  }, [role, isFirebaseUser]);

  // Sync dark theme and localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
    }
    if (ready && typeof localStorage !== 'undefined') {
      localStorage.setItem('qard-demo', JSON.stringify({ role, dark, circleId: circle?.id }));
    }
  }, [role, dark, ready, circle]);

  const handleSignInWithEmail = async (email: string, pass: string) => {
    const loggedInUser = await authService.signInWithEmail(email, pass);
    setUser(loggedInUser);
    setRole(loggedInUser.role);
    setIsFirebaseUser(true);
    return loggedInUser;
  };

  const handleSignUpWithEmail = async (email: string, pass: string, name: string, roleParam: Role = 'Member') => {
    const newUser = await authService.signUpWithEmail(email, pass, name, roleParam);
    setUser(newUser);
    setRole(newUser.role);
    setIsFirebaseUser(true);
    return newUser;
  };

  const handleSignInWithGoogle = async () => {
    const loggedInUser = await authService.signInWithGoogle();
    setUser(loggedInUser);
    setRole(loggedInUser.role);
    setIsFirebaseUser(true);
    return loggedInUser;
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setIsFirebaseUser(false);
    const demo = await authService.getDemoUser('Committee Admin');
    setUser(demo);
    setRole('Committee Admin');
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

  return (
    <DemoContext.Provider
      value={{
        user,
        circle,
        role,
        switchRole: (newRole) => {
          if (isFirebaseUser) {
            handleSignOut();
          }
          setRole(newRole);
        },
        dark,
        toggleTheme: () => setDark((v) => !v),
        isFirebaseUser,
        authModalOpen,
        setAuthModalOpen,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithGoogle: handleSignInWithGoogle,
        resetPassword: (email: string) => authService.resetPassword(email),
        signOut: handleSignOut,
        syncWithFirestore,
        refreshData
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
