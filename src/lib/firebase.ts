import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration with fallback to hardcoded values (same as main app)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBkhEAy18wAhpxkUJwv0XoGTfUbOdq_y3Y",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "skluva.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "skluva",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "skluva.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "567077871212",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:567077871212:web:65517af125e7ce809f8249"
};

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize Firebase with debug logging
if (isBrowser) {
  console.log("Admin App - Initializing Firebase with config:", { 
    ...firebaseConfig, 
    apiKey: firebaseConfig.apiKey ? "PRESENT" : "MISSING",
    authDomain: firebaseConfig.authDomain ? "PRESENT" : "MISSING",
    projectId: firebaseConfig.projectId ? "PRESENT" : "MISSING",
    usingEnvVars: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    usingHardcoded: !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  });
}

let app: FirebaseApp | undefined;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Only initialize Firebase in browser environments
if (isBrowser) {
  try {
    if (getApps().length) {
      console.log("Admin App - Firebase already initialized, getting existing app");
      app = getApps()[0];
    } else {
      console.log("Admin App - Creating new Firebase app instance");
      app = initializeApp(firebaseConfig);
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Admin App - Firebase Auth initialized", auth ? "successfully" : "failed");
    console.log("Admin App - Firebase Firestore initialized", db ? "successfully" : "failed");
  } catch (error) {
    console.error("Admin App - Error initializing Firebase:", error);
    // Don't throw error, just log it to prevent build failures
  }
} else {
  console.log("Admin App - Skipping Firebase initialization in SSR context");
}

// Fallback initialization for server-side or when browser init fails
if (!app) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Admin App - Fallback Firebase initialization completed");
  } catch (error) {
    console.error("Admin App - Fallback Firebase initialization failed:", error);
  }
}

// Initialize storage
const storage = app ? getStorage(app) : undefined;

// Export with proper fallbacks
export { 
  app, 
  auth, 
  db, 
  storage 
};
