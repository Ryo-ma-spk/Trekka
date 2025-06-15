import { useAuth } from '../contexts/AuthContext';

interface SignupCompleteProps {
  onComplete: () => void;
}

export function SignupComplete({ onComplete }: SignupCompleteProps) {
  const { user } = useAuth();

  return (
    <div className="auth-container">
      <div className="auth-card signup-complete-card">
        <div className="auth-header">
          <div className="success-icon-minimal">
            <svg className="success-check" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="success-title-minimal">アカウント作成が完了しました</h1>
          <p className="success-subtitle-minimal">Trekkaでタスク管理を始めましょう</p>
        </div>

        <div className="signup-complete-content-minimal">
          <div className="welcome-card-minimal">
            <div className="user-info-minimal">
              <div className="user-avatar-minimal">
                <span className="avatar-text-minimal">{user?.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="user-details-minimal">
                <h3 className="user-name-minimal">ようこそ</h3>
                <p className="user-email-minimal">{user?.email}</p>
              </div>
            </div>
            
            <div className="features-preview-minimal">
              <div className="feature-list-minimal">
                <div className="feature-item-minimal">
                  <div className="feature-icon-minimal">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="feature-text-minimal">タスクの作成・管理</span>
                </div>
                <div className="feature-item-minimal">
                  <div className="feature-icon-minimal">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="feature-text-minimal">カテゴリ別整理</span>
                </div>
                <div className="feature-item-minimal">
                  <div className="feature-icon-minimal">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 11h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 11V7a7 7 0 0 1 14 0v4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="feature-text-minimal">効率的な進捗管理</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={onComplete}
            className="start-button-minimal"
          >
            始める
          </button>
        </div>
      </div>
    </div>
  );
}