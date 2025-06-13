import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // セッションの自動更新
    autoRefreshToken: true,
    // トークンの持続
    persistSession: true,
    // セッション検知の詳細設定
    detectSessionInUrl: true,
    // 開発環境でのフローの改善
    flowType: 'pkce'
  }
});