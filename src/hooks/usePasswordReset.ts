import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePasswordReset() {
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        // URLのハッシュフラグメントをチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 Checking password reset session:', {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          fullHash: window.location.hash
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