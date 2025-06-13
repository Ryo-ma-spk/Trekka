# Supabase認証設定ガイド - OTP期限切れ対応

## 問題の概要
OTPが「作成してすぐ」に期限切れになる問題の原因と解決策

## 実装した解決策

### 1. Supabaseクライアント設定の改善 (`src/lib/supabase.ts`)
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // セッションの自動更新
    persistSession: true,      // トークンの持続
    detectSessionInUrl: true,  // セッション検知の詳細設定
    flowType: 'pkce'          // 開発環境でのフローの改善
  }
});
```

### 2. Vite設定でポートを固定化 (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true, // ポートが使用中の場合はエラーにする
  }
});
```

### 3. AuthForm設定の改善 (`src/components/AuthForm.tsx`)
- `redirectTo` をより明確に指定: `${window.location.origin}/`
- `magicLink: true` を追加
- デバッグ用の `onAuthStateChange` ハンドラーを追加

### 4. AuthContextのデバッグログ強化 (`src/contexts/AuthContext.tsx`)
- 認証イベントの詳細ログ
- トークン情報の追跡
- OTP関連イベントの特別な処理

## Supabase管理コンソールでの必須設定

### 1. Site URL設定
- Authentication > Settings > Site URL
- 開発環境: `http://localhost:5173`
- 本番環境: 実際のドメイン

### 2. Additional Redirect URLs
- Authentication > Settings > Additional Redirect URLs
- 以下のURLを追加:
  ```
  http://localhost:5173
  http://localhost:5173/
  http://127.0.0.1:5173
  http://127.0.0.1:5173/
  ```

### 3. Email Settings
- Authentication > Settings > Email
- Confirm your email address: Enable
- Double confirm email changes: Enable

### 4. OTP Settings
- Authentication > Settings > Advanced
- Enable email confirmations: ON
- Secure email change enabled: ON
- Email OTP Expiration: 3600 seconds (1 hour)

## デバッグ方法

### 1. コンソールログの確認
開発者ツールのコンソールで以下のログを確認:
- `🔐 Auth state changed:` でイベントとセッション情報
- `Auth UI event:` でAuth UIコンポーネントからのイベント

### 2. URLフラグメントの確認
パスワードリセット後のURLに `#access_token=...&type=recovery` が含まれているか確認

### 3. ネットワークタブの確認
- Supabase APIへのリクエスト・レスポンス
- エラーコードの詳細確認

## よくある問題と解決策

### 1. OTPが即座に期限切れになる
**原因**: リダイレクトURL設定の不一致
**解決策**: Supabase管理コンソールでlocalhost URLを正確に設定

### 2. トークンタイプエラー
**原因**: OTP検証時のtype指定ミス
**解決策**: 
- メールOTP: `type: "email"`
- サインアップOTP: `type: "signup"`
- マジックリンク: `type: "magiclink"`

### 3. セッション検知失敗
**原因**: URLフラグメントが欠如
**解決策**: `detectSessionInUrl: true` と `flowType: 'pkce'` を設定

### 4. CORS エラー
**原因**: localhost URLがSupabaseで許可されていない
**解決策**: すべての可能なlocalhost URLを追加Redirect URLsに登録

## 開発環境での推奨設定

1. **固定ポート使用**: Viteで`strictPort: true`を設定
2. **詳細ログ有効**: 認証フローを詳細に追跡
3. **複数URL登録**: localhost, 127.0.0.1の両方を登録
4. **OTP期間延長**: 開発中は3600秒（1時間）に設定

## 本番環境への移行時注意点

1. **Site URL更新**: 本番ドメインに変更
2. **Redirect URLs清理**: localhost URLを削除
3. **OTP期間短縮**: セキュリティ強化のため300秒（5分）程度に設定
4. **デバッグログ削除**: 本番では詳細ログを無効化