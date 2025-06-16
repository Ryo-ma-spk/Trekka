import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSignupComplete: boolean;
  isPasswordReset: boolean;
  isPasswordResetComplete: boolean;
  clearSignupComplete: () => void;
  clearPasswordReset: () => void;
  setPasswordResetComplete: () => void;
  clearPasswordResetComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignupComplete, setIsSignupComplete] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isPasswordResetComplete, setIsPasswordResetComplete] = useState(false);

  useEffect(() => {
    // URLパラメータからパスワードリセット状態を検出（パスワードリセットリンクからの場合のみ）
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      console.log('Password reset URL detected, setting trigger');
      localStorage.setItem('auth_trigger', 'password_reset');
      // URLパラメータをクリア
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // localStorageからトリガー情報を取得
          const authTrigger = localStorage.getItem('auth_trigger');
          console.log('Auth state change - event:', event, 'trigger:', authTrigger);
          
          // URLパラメータも確認
          const urlParams = new URLSearchParams(window.location.search);
          const isResetUrl = urlParams.get('reset') === 'true';
          
          if (authTrigger === 'signup' && !isResetUrl) {
            console.log('Showing signup complete');
            setIsSignupComplete(true);
            localStorage.removeItem('auth_trigger');
          } else if (authTrigger === 'password_reset' || isResetUrl) {
            console.log('Showing password reset');
            setIsPasswordReset(true);
            localStorage.removeItem('auth_trigger');
          }
        }
        
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  const clearSignupComplete = () => {
    setIsSignupComplete(false);
  };

  const clearPasswordReset = () => {
    console.log('Clearing password reset state, showing completion');
    setIsPasswordReset(false);
    setPasswordResetComplete(true);
  };

  const setPasswordResetComplete = () => {
    setIsPasswordResetComplete(true);
  };

  const clearPasswordResetComplete = () => {
    console.log('Clearing password reset complete state, returning to login');
    setIsPasswordResetComplete(false);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isSignupComplete,
    isPasswordReset,
    isPasswordResetComplete,
    clearSignupComplete,
    clearPasswordReset,
    setPasswordResetComplete,
    clearPasswordResetComplete,
  };

  return (
    <AuthContext.Provider value={value}>
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