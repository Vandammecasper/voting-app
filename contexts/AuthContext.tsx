import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const app = getApp();
    const auth = getAuth(app);
    
    console.log('🔥 Firebase App initialized:', app.name);
    console.log('🔐 Setting up auth state listener...');

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is already signed in
        console.log('✅ User already authenticated');
        console.log('   └─ User ID:', currentUser.uid);
        console.log('   └─ Is Anonymous:', currentUser.isAnonymous);
        console.log('   └─ Created At:', currentUser.metadata.creationTime);
        setUser(currentUser);
        setIsLoading(false);
      } else {
        // No user signed in, sign in anonymously
        console.log('👤 No user found, signing in anonymously...');
        try {
          const userCredential = await signInAnonymously(auth);
          console.log('✅ Anonymous sign-in successful!');
          console.log('   └─ User ID:', userCredential.user.uid);
          console.log('   └─ Is Anonymous:', userCredential.user.isAnonymous);
          setUser(userCredential.user);
        } catch (error) {
          console.error('❌ Anonymous sign-in failed:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔐 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
