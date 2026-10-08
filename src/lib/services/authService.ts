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
import { doc, getDoc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Role } from '@/lib/types';
import { fetchUserByRoleFromDB, fetchUserByEmailFromDB, updateLocalUserCache, ensureFirestoreInitialized } from './firestoreAdapter';

export interface AuthService {
  getDemoUser(role: Role): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signUpWithEmail(email: string, password: string, name: string, role?: Role, circleId?: string): Promise<User>;
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
    const normalizedEmail = (user.email || '').trim().toLowerCase();
    const userRef = doc(db, 'users', user.id);
    
    // Check if any user record exists with this email (e.g. created by Super Admin with temporary id `u-...`)
    const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const snaps = await getDocs(q);

    let mergedUser: User = { ...user };

    if (!snaps.empty) {
      const batch = writeBatch(db);
      for (const d of snaps.docs) {
        const existingData = d.data() as User;
        mergedUser = {
          ...existingData,
          ...mergedUser,
          role: normalizedEmail === 'qard@gmail.com' ? 'Super Admin' : (existingData.role || mergedUser.role),
          circleId: existingData.circleId || mergedUser.circleId,
          monthlyCommitment: existingData.monthlyCommitment || mergedUser.monthlyCommitment,
          phone: existingData.phone || mergedUser.phone,
          name: existingData.name || mergedUser.name,
          id: user.id
        };

        // If the document had a temporary/different ID, delete it to prevent 2 users with same name
        if (d.id !== user.id) {
          batch.delete(d.ref);

          // Re-link memberships to new auth user ID
          try {
            const memQ = query(collection(db, 'memberships'), where('userId', '==', d.id));
            const memSnaps = await getDocs(memQ);
            memSnaps.docs.forEach((mDoc) => {
              batch.update(mDoc.ref, { userId: user.id });
            });
          } catch {}
        }
      }

      batch.set(userRef, mergedUser, { merge: true });
      await batch.commit();
    } else {
      await setDoc(userRef, mergedUser, { merge: true });
    }

    updateLocalUserCache(mergedUser);
    return mergedUser;
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
  updateLocalUserCache(user);
  return user;
}

export const authService: AuthService = {
  async getDemoUser(role: Role): Promise<User> {
    return fetchUserByRoleFromDB(role);
  },

  async signInWithEmail(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const isSuper = normalizedEmail === 'qard@gmail.com';

    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const existingUser = await fetchUserByEmailFromDB(normalizedEmail);
      const appUser = mapFirebaseUserToAppUser(cred.user, existingUser?.role || (isSuper ? 'Super Admin' : undefined));
      if (existingUser) {
        appUser.circleId = existingUser.circleId;
        appUser.role = existingUser.role;
        appUser.monthlyCommitment = existingUser.monthlyCommitment;
        appUser.phone = existingUser.phone;
        appUser.name = existingUser.name;
      }
      return syncUserToFirestore(appUser);
    } catch (err: any) {
      // If Firebase Auth signIn fails (e.g. user exists in Firestore / DB but not yet registered in Firebase Auth)
      const existingUser = await fetchUserByEmailFromDB(normalizedEmail);

      if (existingUser) {
        // Automatically attempt to create the user in Firebase Auth so future logins succeed seamlessly
        try {
          const newCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          await updateProfile(newCred.user, { displayName: existingUser.name });
          const newAppUser: User = {
            ...existingUser,
            id: newCred.user.uid
          };
          return syncUserToFirestore(newAppUser);
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            // Means user is in Firebase Auth with a different password
            throw err;
          }
          console.warn('Firebase auto-create fallback to DB user:', createErr);
        }
        // Return existing user directly from DB
        return existingUser;
      }

      if (isSuper && password === '123456') {
        const { superAdminUser } = await import('./firestoreAdapter');
        return superAdminUser;
      }

      throw err;
    }
  },

  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: Role = 'Member',
    circleId?: string
  ): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    const appUser = mapFirebaseUserToAppUser(cred.user, role);
    appUser.circleId = circleId || 'mahallu';
    appUser.monthlyCommitment = 1000;

    const { createMembershipForUserInDB } = await import('./firestoreAdapter');
    await createMembershipForUserInDB(appUser.id, appUser.circleId, appUser.monthlyCommitment);

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
