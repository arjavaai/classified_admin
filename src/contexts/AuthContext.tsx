'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface User {
  email: string;
  role: 'admin' | 'super_admin';
  uid?: string; // Add Firebase UID
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined admin accounts - these should match Firebase accounts
const ADMIN_ACCOUNTS = {
  'admin@skluva.com': {
    password: 'Admin123!',
    role: 'admin' as const
  },
  'skluva.com@gmail.com': {
    password: 'SuperAdmin123!',
    role: 'super_admin' as const
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.log('Firebase auth not initialized');
      setLoading(false);
      return;
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check if this is an admin user
        const adminAccount = ADMIN_ACCOUNTS[firebaseUser.email as keyof typeof ADMIN_ACCOUNTS];
        if (adminAccount) {
          const user: User = {
            email: firebaseUser.email!,
            role: adminAccount.role,
            uid: firebaseUser.uid
          };
          setUser(user);
          localStorage.setItem('admin_user', JSON.stringify(user));
        } else {
          // Not an admin user, sign out
          if (auth) {
            firebaseSignOut(auth);
          }
          setUser(null);
          localStorage.removeItem('admin_user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('admin_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase authentication not initialized');
    }

    // Check if this is a valid admin account
    const account = ADMIN_ACCOUNTS[email as keyof typeof ADMIN_ACCOUNTS];
    if (!account) {
      throw new Error('Invalid admin credentials');
    }

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign-in successful:', userCredential.user.email);
      
      // The onAuthStateChanged listener will handle setting the user state
    } catch (error: any) {
      console.error('Firebase sign-in error:', error);
      
      // If Firebase auth fails, fall back to localStorage-based auth for development
      if (account.password === password) {
        console.log('Falling back to localStorage auth for development');
        const user: User = {
          email,
          role: account.role
        };
        setUser(user);
        localStorage.setItem('admin_user', JSON.stringify(user));
      } else {
        throw new Error('Invalid credentials');
      }
    }
  };

  const signOut = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.error('Firebase sign-out error:', error);
      }
    }
    
    // Always clear local state
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
