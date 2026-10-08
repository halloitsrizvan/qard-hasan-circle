import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService, circleService, seedFirestore } from '@/lib/services';
import { ensureFirestoreInitialized, defaultCircles } from '@/lib/services/firestoreAdapter';
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
  signUpWithEmail: (email: string, pass: string, name: string, role?: Role, circleId?: string) => Promise<User>;
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
const ACTIVE_CIRCLE_STORAGE_KEY = 'qard-active-mahall-id';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth && roles.includes(savedAuth as Role)) return savedAuth as Role;
        const savedPref = JSON.parse(localStorage.getItem('qard-demo') ?? '{}');
        if (roles.includes(savedPref.role)) return savedPref.role;
      } catch {}
    }
    return 'Member';
  });

  const [user, setUser] = useState<User | null>(null);

  const [circle, setCircle] = useState<Circle | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCircleId = localStorage.getItem(ACTIVE_CIRCLE_STORAGE_KEY);
        if (savedCircleId) {
          const found = defaultCircles.find((c) => c.id === savedCircleId);
          if (found) return structuredClone(found);
        }
      } catch {}
    }
    return structuredClone(defaultCircles[0]!);
  });

  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Initialize DB and restore theme/preferences & active circle from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('qard-theme');
      if (savedTheme) setDark(savedTheme === 'dark');

      const savedRole = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedRole && roles.includes(savedRole as Role)) setRole(savedRole as Role);

      const savedCircleId = localStorage.getItem(ACTIVE_CIRCLE_STORAGE_KEY);
      if (savedCircleId) {
        circleService.switchActiveCircle(savedCircleId).then(setCircle).catch(() => {
          circleService.getActive().then(setCircle).catch(() => {});
        });
      } else {
        circleService.getActive().then(setCircle).catch(() => {});
      }
    } catch {
      circleService.getActive().then(setCircle).catch(() => {});
    }
    setReady(true);
    ensureFirestoreInitialized();
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

  const queryClient = useQueryClient();

  const handleSignInWithEmail = async (email: string, pass: string) => {
    const loggedInUser = await authService.signInWithEmail(email, pass);
    setUser(loggedInUser);
    setRole(loggedInUser.role);
    setIsFirebaseUser(true);
    setIsDemoUser(false);
    if (loggedInUser.circleId) {
      try {
        const c = await circleService.switchActiveCircle(loggedInUser.circleId);
        setCircle(c);
      } catch {}
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    await queryClient.invalidateQueries();
    return loggedInUser;
  };

  const handleSignUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    roleParam: Role = 'Member',
    circleId?: string
  ) => {
    const newUser = await authService.signUpWithEmail(email, pass, name, roleParam, circleId);
    setUser(newUser);
    setRole(newUser.role);
    setIsFirebaseUser(true);
    setIsDemoUser(false);
    if (newUser.circleId) {
      try {
        const c = await circleService.switchActiveCircle(newUser.circleId);
        setCircle(c);
      } catch {}
    }
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    await queryClient.invalidateQueries();
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
    await queryClient.invalidateQueries();
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
    await queryClient.invalidateQueries();
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
    await queryClient.invalidateQueries();
  };

  const handleSwitchRole = async (newRole: Role) => {
    if (isFirebaseUser) {
      await handleSignOut();
    }
    await handleSignInAsDemo(newRole);
  };

  const syncWithFirestore = async (force = false) => {
    const res = await seedFirestore(force);
    const updatedCircle = await circleService.getActive();
    setCircle(updatedCircle);
    await queryClient.invalidateQueries();
    return res;
  };

  const refreshData = async () => {
    const updatedCircle = await circleService.getActive();
    setCircle(updatedCircle);
    await queryClient.invalidateQueries();
  };

  const handleSwitchCircle = async (circleId: string) => {
    try {
      const selected = await circleService.switchActiveCircle(circleId);
      setCircle(selected);
      try {
        localStorage.setItem(ACTIVE_CIRCLE_STORAGE_KEY, circleId);
      } catch {}
      await queryClient.invalidateQueries();
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

