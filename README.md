# Trekka

日本語対応のタスク管理アプリケーション

## 機能

- ✅ タスクの作成・編集・削除
- 📁 カテゴリ別タスク管理
- 🖱️ ドラッグ&ドロップによる直感的操作
- 📱 レスポンシブデザイン（モバイル対応）
- 🔐 Supabaseによる安全な認証
- 🎨 モダンなUI/UX

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: CSS3 (カスタムCSS)
- **認証・DB**: Supabase
- **ドラッグ&ドロップ**: カスタム実装
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

Supabaseプロジェクトの設定値を入力：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## Vercelへのデプロイ

1. Vercelアカウントにログイン
2. GitHubリポジトリと連携
3. 環境変数を設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. デプロイ実行

## ライセンス

MIT License