import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCqMnx3I8vRQ9RT5VeRTTlXs-cldienckA",
  authDomain: "hojathon-85be6.firebaseapp.com",
  projectId: "hojathon-85be6",
  storageBucket: "hojathon-85be6.firebasestorage.app",
  messagingSenderId: "512336023600",
  appId: "1:512336023600:web:dd701fac7939c44c141df5",
  measurementId: "G-Y7L32NKCRH"
};

// Initialize Firebase safely for SSR and browser
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Safe Analytics initialization (only in browser environment)
let analyticsInstance: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported or blocked (e.g. adblockers), ignore gracefully
  });
}

export const getAnalyticsInstance = () => analyticsInstance;
