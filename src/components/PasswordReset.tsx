import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PasswordResetProps {
  onComplete: () => void;
}

export function PasswordReset({ onComplete }: PasswordResetProps) {
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
      // 現在認証済みの状態でパスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;

      // パスワード更新成功 - 完了画面表示
      onComplete();
    } catch (error: any) {
      setError(error.message || 'パスワードの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card password-reset-card">
        <div className="auth-header">
          <div className="reset-icon-minimal">
            <svg className="lock-icon" viewBox="0 0 24 24" fill="none">
              <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="15" r="1" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="reset-title-minimal">パスワードを変更</h1>
          <p className="reset-subtitle-minimal">新しいパスワードを入力してアカウントのセキュリティを更新してください</p>
        </div>
        
        <div className="password-form premium-form">
          <div className="input-group-minimal">
            <label className="input-label-minimal">新しいパスワード</label>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="8文字以上のパスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-input-minimal"
                disabled={loading}
              />
              {newPassword.length > 0 && (
                <div className="password-strength">
                  <div className={`strength-indicator ${newPassword.length >= 8 ? 'strong' : 'weak'}`}>
                    {newPassword.length >= 8 ? '強力' : '弱い'}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="input-group-minimal">
            <label className="input-label-minimal">パスワード確認</label>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="上記と同じパスワード"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input-minimal"
                disabled={loading}
              />
              {confirmPassword && (
                <div className="match-indicator">
                  {newPassword === confirmPassword ? (
                    <span className="match-success">✓</span>
                  ) : (
                    <span className="match-error">×</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button 
            onClick={handlePasswordUpdate}
            className="reset-button-minimal"
            disabled={!newPassword || !confirmPassword || loading || newPassword !== confirmPassword}
          >
            {loading ? (
              <span className="button-loading">
                <span className="spinner-minimal"></span>
                更新中
              </span>
            ) : (
              'パスワードを更新'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}