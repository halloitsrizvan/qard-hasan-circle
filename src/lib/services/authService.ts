import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
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
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  subscribeToAuth(callback: (user: User | null) => void): () => void;
}

function mapFirebaseUserToAppUser(fbUser: FirebaseUser, extraRole?: Role): User {
  const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'Community Member';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'CM';

  return {
    id: fbUser.uid,
    name,
    email: fbUser.email || '',
    role: extraRole || 'Member',
    initials
  };
}

async function syncUserToFirestore(user: User): Promise<User> {
  try {
    const userRef = doc(db, 'users', user.id);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as User;
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
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const appUser = mapFirebaseUserToAppUser(cred.user);
    return syncUserToFirestore(appUser);
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
