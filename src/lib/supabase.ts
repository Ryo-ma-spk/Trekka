import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // 開発環境での適切な設定
    storageKey: 'sb-auth-token',
    storage: window.localStorage,
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'Accept-Language': 'ja'
    }
  }
});

// サインアップ時の日本語メール設定
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        locale: 'ja'
      }
    }
  });
};

// パスワードリセット時の日本語メール設定
export const resetPasswordForEmail = async (email: string) => {
  // パスワードリセットトリガーを事前に設定
  localStorage.setItem('auth_trigger', 'password_reset');
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}`
  });
};