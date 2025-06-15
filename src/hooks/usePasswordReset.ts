import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePasswordReset() {
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [recoveryTokens, setRecoveryTokens] = useState<{access_token: string, refresh_token: string} | null>(null);

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {

        // URLのハッシュとクエリパラメータをチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        

        // 可能性のあるパスワードリセット検出パターン
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        const code = searchParams.get('code');
        

        // パスワードリセット検出の優先順位
        let resetDetected = false;
        let tokens = null;

        // 1. ハッシュベースのrecoveryトークン（最優先）
        if (hashType === 'recovery' && accessToken && refreshToken) {
          tokens = { access_token: accessToken, refresh_token: refreshToken };
          resetDetected = true;
        }
        // 2. PKCEコードが存在する場合
        else if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session) {
              tokens = {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token || ''
              };
              resetDetected = true;
            }
          } catch (error) {
          }
        }

        // パスワードリセットモードの設定
        if (resetDetected && tokens) {
          setRecoveryTokens(tokens);
          setIsPasswordResetMode(true);
          
          // URLをクリア
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
        }
      } catch (error) {
      } finally {
        setIsChecking(false);
      }
    };

    checkPasswordResetSession();
  }, []);

  const completePasswordReset = () => {
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