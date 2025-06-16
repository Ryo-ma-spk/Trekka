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
    // URLパラメータからパスワードリセット状態を検出
    const urlParams = new URLSearchParams(window.location.search);
    const hasAccessToken = urlParams.get('access_token');
    const hasRefreshToken = urlParams.get('refresh_token');
    const hasType = urlParams.get('type');
    
    // Supabaseのパスワードリセットリンクかどうかを判定
    if (hasAccessToken && hasRefreshToken && hasType === 'recovery') {
      localStorage.setItem('auth_trigger', 'password_reset');
    } else if (urlParams.get('reset') === 'true') {
      localStorage.setItem('auth_trigger', 'password_reset');
      // カスタムパラメータをクリア
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // セッション取得エラー（プロダクション環境では無視）
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
      } catch (error) {
        // セッション取得中にエラーが発生（プロダクション環境では無視）
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // localStorageからトリガー情報を取得
          const authTrigger = localStorage.getItem('auth_trigger');
          
          // URLパラメータも確認
          const urlParams = new URLSearchParams(window.location.search);
          const hasAccessToken = urlParams.get('access_token');
          const hasRefreshToken = urlParams.get('refresh_token');
          const hasType = urlParams.get('type');
          const isResetUrl = urlParams.get('reset') === 'true';
          const isPasswordResetFlow = hasAccessToken && hasRefreshToken && hasType === 'recovery';
          
          if (authTrigger === 'signup' && !isResetUrl && !isPasswordResetFlow) {
            setIsSignupComplete(true);
            localStorage.removeItem('auth_trigger');
          } else if (authTrigger === 'password_reset' || isResetUrl || isPasswordResetFlow) {
            setIsPasswordReset(true);
            localStorage.removeItem('auth_trigger');
            // URLパラメータをクリア（パスワードリセット後）
            if (isPasswordResetFlow) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // サインアウト時の状態リセット
          setIsSignupComplete(false);
          setIsPasswordReset(false);
          setIsPasswordResetComplete(false);
          localStorage.removeItem('auth_trigger');
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
      // 開発環境でのデバッグログ
      if (import.meta.env.DEV) {
        console.log('🔓 Starting signOut process...');
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        if (import.meta.env.DEV) {
          console.error('❌ SignOut error:', error);
        }
        // 開発環境ではエラーがあっても強制的にローカル状態をクリア
        if (import.meta.env.DEV) {
          console.log('🧹 Force clearing local state in dev mode...');
          setSession(null);
          setUser(null);
          setIsSignupComplete(false);
          setIsPasswordReset(false);
          setIsPasswordResetComplete(false);
          localStorage.removeItem('auth_trigger');
          localStorage.removeItem('sb-auth-token');
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('✅ SignOut successful');
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ SignOut catch error:', error);
        // 開発環境ではキャッチエラーでも強制クリア
        console.log('🧹 Force clearing local state after catch...');
        setSession(null);
        setUser(null);
        setIsSignupComplete(false);
        setIsPasswordReset(false);
        setIsPasswordResetComplete(false);
        localStorage.removeItem('auth_trigger');
        localStorage.removeItem('sb-auth-token');
      }
    }
  };

  const clearSignupComplete = () => {
    setIsSignupComplete(false);
  };

  const clearPasswordReset = () => {
    setIsPasswordReset(false);
    setPasswordResetComplete();
  };

  const setPasswordResetComplete = () => {
    setIsPasswordResetComplete(true);
  };

  const clearPasswordResetComplete = () => {
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
    throw new Error('useAuthはAuthProvider内で使用してください');
  }
  return context;
}