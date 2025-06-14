import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePasswordReset() {
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [recoveryTokens, setRecoveryTokens] = useState<{access_token: string, refresh_token: string} | null>(null);

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        console.log('🔍 URL ANALYSIS:');
        console.log('URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);

        // URLのハッシュとクエリパラメータをチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // 全てのパラメータをログ出力
        console.log('🔍 Hash params:', Object.fromEntries(hashParams.entries()));
        console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));

        // 可能性のあるパスワードリセット検出パターン
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        const code = searchParams.get('code');
        
        console.log('🔍 DETECTION RESULTS:');
        console.log('- access_token:', !!accessToken);
        console.log('- refresh_token:', !!refreshToken);
        console.log('- type:', hashType);
        console.log('- code:', !!code);

        // パスワードリセット検出の優先順位
        let resetDetected = false;
        let tokens = null;

        // 1. ハッシュベースのrecoveryトークン（最優先）
        if (hashType === 'recovery' && accessToken && refreshToken) {
          console.log('✅ DETECTED: Hash-based recovery tokens');
          tokens = { access_token: accessToken, refresh_token: refreshToken };
          resetDetected = true;
        }
        // 2. PKCEコードが存在する場合
        else if (code) {
          console.log('✅ DETECTED: PKCE code - attempting to exchange');
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session) {
              console.log('✅ PKCE session established - assuming password reset');
              tokens = {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token || ''
              };
              resetDetected = true;
            }
          } catch (error) {
            console.error('❌ PKCE exchange failed:', error);
          }
        }

        // パスワードリセットモードの設定
        if (resetDetected && tokens) {
          setRecoveryTokens(tokens);
          setIsPasswordResetMode(true);
          console.log('🔐 PASSWORD RESET MODE ACTIVATED');
          
          // URLをクリア
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          console.log('ℹ️ No password reset detected - normal flow');
        }
      } catch (error) {
        console.error('❌ Error in password reset check:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPasswordResetSession();
  }, []);

  const completePasswordReset = () => {
    console.log('🔐 Completing password reset');
    setIsPasswordResetMode(false);
    setRecoveryTokens(null);
  };

  return {
    isPasswordResetMode,
    isChecking,
    completePasswordReset,
    recoveryTokens
  };
}