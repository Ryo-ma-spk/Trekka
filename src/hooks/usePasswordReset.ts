import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePasswordReset() {
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        console.log('🔍 Full URL analysis:', {
          fullURL: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
          pathname: window.location.pathname
        });

        // URLのハッシュフラグメントをチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // URLクエリパラメータもチェック
        const searchParams = new URLSearchParams(window.location.search);
        const searchType = searchParams.get('type');
        const token = searchParams.get('token');

        console.log('🔍 Checking password reset session:', {
          hashType: type,
          searchType: searchType,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasToken: !!token,
          fullHash: window.location.hash,
          fullSearch: window.location.search
        });

        // パスワードリセット用のトークンかどうかをチェック
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('🔐 Password reset session detected via URL hash');
          
          // Supabaseセッションを設定
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('❌ Failed to set session:', error);
            throw error;
          }

          console.log('✅ Password reset session established');
          setIsPasswordResetMode(true);
          
          // URLのハッシュをクリア
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (searchType === 'recovery' && token) {
          // クエリパラメータベースのパスワードリセット検出
          console.log('🔐 Password reset detected via query parameters');
          setIsPasswordResetMode(true);
          
          // URLのクエリパラメータをクリア
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (localStorage.getItem('debug_password_reset') === 'true') {
          // デバッグ用のパスワードリセットモード
          console.log('🔐 Debug password reset mode activated');
          localStorage.removeItem('debug_password_reset');
          setIsPasswordResetMode(true);
        } else {
          // 通常のセッション確認
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔍 Regular session check:', !!session);
        }
      } catch (error) {
        console.error('❌ Error checking password reset session:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPasswordResetSession();

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change in password reset hook:', event);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔐 PASSWORD_RECOVERY event detected');
          setIsPasswordResetMode(true);
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordResetMode(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const completePasswordReset = () => {
    setIsPasswordResetMode(false);
  };

  return {
    isPasswordResetMode,
    isChecking,
    completePasswordReset
  };
}