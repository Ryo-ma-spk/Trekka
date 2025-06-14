import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PasswordResetProps {
  onComplete: () => void;
  onCancel: () => void;
  recoveryTokens?: {access_token: string, refresh_token: string} | null;
}

export function PasswordReset({ onComplete, onCancel, recoveryTokens }: PasswordResetProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (newPassword.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (!recoveryTokens) {
      setError('リカバリートークンが見つかりません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // まずリカバリートークンでセッションを設定
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryTokens.access_token,
        refresh_token: recoveryTokens.refresh_token
      });

      if (sessionError) throw sessionError;

      // セッション設定後にパスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;

      // パスワード更新完了後、サインアウトしてログインページに遷移
      await supabase.auth.signOut();
      alert('パスワードが正常に更新されました。新しいパスワードでログインしてください。');
      onComplete();
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'パスワードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="password-recovery-container">
        <div className="password-recovery-card">
          <h2>新しいパスワードを設定</h2>
          <div className="password-form">
            <input
              type="password"
              placeholder="新しいパスワード"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="password-input"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="新しいパスワード（確認）"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="password-input"
              disabled={loading}
            />
            <button 
              onClick={handlePasswordUpdate}
              className="password-update-btn"
              disabled={!newPassword || !confirmPassword || loading}
            >
              パスワードを更新
            </button>
            <button 
              onClick={onCancel}
              className="password-cancel-btn"
              disabled={loading}
            >
              スキップ
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
}