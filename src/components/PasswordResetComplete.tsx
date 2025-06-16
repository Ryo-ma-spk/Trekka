import { useAuth } from '../contexts/AuthContext';

interface PasswordResetCompleteProps {
  onComplete: () => void;
}

export function PasswordResetComplete({ onComplete }: PasswordResetCompleteProps) {
  const { signOut } = useAuth();

  const handleReturnToLogin = async () => {
    await signOut();
    onComplete();
  };

  return (
    <div className="auth-container">
      <div className="auth-card password-reset-complete-card">
        <div className="auth-header">
          <div className="success-icon-minimal">
            <svg className="success-check" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="success-title-minimal">パスワード変更が完了しました</h1>
          <p className="success-subtitle-minimal">新しいパスワードでログインしてTrekkaを続けてご利用ください</p>
        </div>

        <div className="password-reset-complete-content">
          <div className="completion-message">
            <div className="security-info">
              <div className="info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>パスワードが正常に更新されました</span>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>アカウントのセキュリティが強化されました</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleReturnToLogin}
            className="return-login-button"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}