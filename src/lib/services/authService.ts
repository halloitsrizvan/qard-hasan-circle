import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Role } from '@/lib/types';
import { fetchUserByRoleFromDB, ensureFirestoreInitialized } from './firestoreAdapter';

export interface AuthService {
  getDemoUser(role: Role): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signUpWithEmail(email: string, password: string, name: string, role?: Role): Promise<User>;
  signInWithGoogle(): Promise<User>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  subscribeToAuth(callback: (user: User | null) => void): () => void;
}

function mapFirebaseUserToAppUser(fbUser: FirebaseUser, extraRole?: Role): User {
  const isSuperAdmin = fbUser.email?.toLowerCase() === 'qard@gmail.com';
  const name = isSuperAdmin ? 'Super Admin' : fbUser.displayName || fbUser.email?.split('@')[0] || 'Community Member';
  const initials = isSuperAdmin
    ? 'SA'
    : name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'CM';

  return {
    id: fbUser.uid,
    name,
    email: fbUser.email || '',
    role: isSuperAdmin ? 'Super Admin' : extraRole || 'Member',
    initials
  };
}

async function syncUserToFirestore(user: User): Promise<User> {
  try {
    const userRef = doc(db, 'users', user.id);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as User;
      // Preserve Super Admin role for qard@gmail.com
      if (user.email.toLowerCase() === 'qard@gmail.com' && data.role !== 'Super Admin') {
        await setDoc(userRef, { role: 'Super Admin' }, { merge: true });
        return { ...data, role: 'Super Admin' };
      }
      return data;
    }
    await setDoc(userRef, user, { merge: true });
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
  return user;
}

export const authService: AuthService = {
  async getDemoUser(role: Role): Promise<User> {
    return fetchUserByRoleFromDB(role);
  },

  async signInWithEmail(email: string, password: string): Promise<User> {
    const isSuper = email.trim().toLowerCase() === 'qard@gmail.com';

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const appUser = mapFirebaseUserToAppUser(cred.user, isSuper ? 'Super Admin' : undefined);
      return syncUserToFirestore(appUser);
    } catch (err: any) {
      // If Super Admin account does not exist in Firebase yet, auto-create it seamlessly
      if (isSuper && password === '123456') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, 'qard@gmail.com', '123456');
          await updateProfile(newCred.user, { displayName: 'Super Admin' });
          const newSuperUser = mapFirebaseUserToAppUser(newCred.user, 'Super Admin');
          return syncUserToFirestore(newSuperUser);
        } catch (createErr) {
          console.warn('Firebase auto-create Super Admin fallback to local:', createErr);
        }
        // If Firebase is blocked/offline, return verified Super Admin session
        const { superAdminUser } = await import('./firestoreAdapter');
        return superAdminUser;
      }
      throw err;
    }
  },

  async signUpWithEmail(email: string, password: string, name: string, role: Role = 'Member'): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const appUser = mapFirebaseUserToAppUser(cred.user, role);
    return syncUserToFirestore(appUser);
  },

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const appUser = mapFirebaseUserToAppUser(cred.user);
    return syncUserToFirestore(appUser);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  async signOut(): Promise<void> {
    await fbSignOut(auth);
  },

  async getCurrentUser(): Promise<User | null> {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    return syncUserToFirestore(mapFirebaseUserToAppUser(fbUser));
  },

  subscribeToAuth(callback: (user: User | null) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const user = await syncUserToFirestore(mapFirebaseUserToAppUser(fbUser));
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};
