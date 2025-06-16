import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export function AuthForm() {
  useEffect(() => {
    // フォーム送信時にトリガーを保存
    const handleFormSubmit = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // ボタンが直接クリックされた場合
      if (target.tagName === 'BUTTON') {
        const button = target as HTMLButtonElement;
        const buttonText = button.textContent?.toLowerCase() || '';
        
        console.log('Button clicked:', buttonText);
        
        // パスワードリセット判定
        if (buttonText.includes('パスワードリセット') || buttonText.includes('送信') || buttonText.includes('reset')) {
          localStorage.setItem('auth_trigger', 'password_reset');
          console.log('Set trigger: password_reset');
        }
        // アカウント作成判定
        else if (buttonText.includes('アカウント作成') || buttonText.includes('sign up') || buttonText.includes('作成')) {
          localStorage.setItem('auth_trigger', 'signup');
          console.log('Set trigger: signup');
        }
        // 通常ログイン
        else if (buttonText.includes('ログイン') || buttonText.includes('sign in')) {
          localStorage.setItem('auth_trigger', 'signin');
          console.log('Set trigger: signin');
        }
      }
    };

    // クリックイベントで監視
    document.addEventListener('click', handleFormSubmit, true);

    return () => {
      document.removeEventListener('click', handleFormSubmit, true);
    };
  }, []);
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Trekka</h1>
          <p>ログインしてタスク管理を始めましょう</p>
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
          redirectTo={`${window.location.origin}?reset=true`}
          // 開発環境ではメール確認をスキップ
          skipConfirmation={import.meta.env.DEV}
          onlyThirdPartyProviders={false}
          showLinks={true}
          view="sign_in"
          // MagicLink無効化
          magicLink={false}
          localization={{
            variables: {
              sign_in: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: 'パスワードを入力',
                button_label: 'ログイン',
                loading_button_label: 'ログイン',
                social_provider_text: '{{provider}} でログイン',
                link_text: 'アカウントをお持ちの方はこちら',
                email_address_invalid: 'メールアドレスの形式が正しくありません',
                password_is_required: 'パスワードを入力してください',
                email_not_confirmed: 'メールアドレスの確認が必要です',
                invalid_credentials: 'メールアドレスまたはパスワードが間違っています',
                too_many_requests: 'しばらく時間をおいてから再度お試しください',
                weak_password: 'パスワードが弱すぎます',
                signup_disabled: 'アカウント作成が無効になっています',
              },
              sign_up: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: 'パスワードを入力',
                button_label: 'アカウント作成',
                loading_button_label: 'アカウント作成',
                social_provider_text: '{{provider}} でアカウント作成',
                link_text: 'アカウントをお持ちでない方はこちら',
                confirmation_text: '確認メールを送信しました。メールをご確認ください。',
                email_address_invalid: 'メールアドレスの形式が正しくありません',
                password_is_required: 'パスワードを入力してください',
                email_not_confirmed: 'メールアドレスの確認が必要です',
                weak_password: 'パスワードは6文字以上で入力してください',
                signup_disabled: 'アカウント作成が無効になっています',
                email_address_not_authorized: 'このメールアドレスは許可されていません',
                user_already_registered: 'このメールアドレスは既に登録済みです',
              },
              forgotten_password: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                email_input_placeholder: 'your@email.com',
                button_label: 'パスワードリセットメールを送信',
                loading_button_label: 'パスワードリセットメールを送信',
                link_text: 'パスワードを忘れた・変更したい方はこちら',
                confirmation_text: 'パスワードリセット用のメールを送信しました。メールをご確認ください。',
                email_address_invalid: 'メールアドレスの形式が正しくありません',
                email_not_confirmed: 'メールアドレスの確認が必要です',
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