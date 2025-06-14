import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PasswordResetProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function PasswordReset({ onComplete, onCancel }: PasswordResetProps) {
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

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      alert('パスワードが正常に更新されました');
      onComplete();
    } catch (error: any) {
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
              {loading ? 'パスワードを更新中...' : 'パスワードを更新'}
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