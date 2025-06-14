import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

export function AuthForm() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Trekka</h1>
          <p>ログインしてタスク管理を始めましょう</p>
        </div>
        
        {/* デバッグ用：パスワードリセットテストボタン */}
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>デバッグ用:</p>
          <button 
            onClick={() => {
              console.log('🔐 Manual password reset mode trigger');
              localStorage.setItem('debug_password_reset', 'true');
              window.location.reload();
            }}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            パスワードリセット画面をテスト
          </button>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#667eea',
                  brandAccent: '#4f46e5',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#f8fafc',
                  defaultButtonBackgroundHover: '#f1f5f9',
                  inputBackground: 'white',
                  inputBorder: '#e2e8f0',
                  inputBorderHover: '#667eea',
                  inputBorderFocus: '#4f46e5',
                }
              }
            },
            style: {
              button: {
                borderRadius: '12px',
                fontWeight: '600',
                padding: '12px 24px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              },
              input: {
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                border: '2px solid #e2e8f0',
                transition: 'all 0.2s ease',
              },
              container: {
                gap: '16px',
              },
              divider: {
                background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)',
                height: '1px',
              }
            }
          }}
          providers={[]}
          redirectTo={`${window.location.origin}/`}
          onlyThirdPartyProviders={false}
          showLinks={true}
          view="sign_in"
          // OTP関連の追加設定
          magicLink={true}
          localization={{
            variables: {
              sign_in: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: 'パスワードを入力',
                button_label: 'ログイン',
                loading_button_label: 'ログイン中...',
                social_provider_text: '{{provider}} でログイン',
                link_text: 'アカウントをお持ちの方はこちら',
              },
              sign_up: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: 'パスワードを入力',
                button_label: 'アカウント作成',
                loading_button_label: 'アカウント作成中...',
                social_provider_text: '{{provider}} でアカウント作成',
                link_text: 'アカウントをお持ちでない方はこちら',
              },
              forgotten_password: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                button_label: 'パスワードリセット',
                loading_button_label: '送信中...',
                link_text: 'パスワードをお忘れですか？',
              },
            },
          }}
        />
        
        <div className="auth-footer">
          <p>
            アカウントを作成することで、
            <br />
            利用規約とプライバシーポリシーに同意したものとします。
          </p>
        </div>
      </div>
    </div>
  );
}