# SlideAI Chatbot セットアップガイド

## 1. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてアカウントを作成
2. 「New Project」をクリックして新しいプロジェクトを作成
3. プロジェクト名とデータベースパスワードを設定

## 2. データベーススキーマの設定

1. Supabase Dashboard で「SQL Editor」を開く
2. `supabase/migrations/001_initial_schema.sql` の内容をコピー
3. SQL Editorに貼り付けて「Run」を実行

## 3. Google OAuth の設定

### Supabase側の設定

1. Supabase Dashboard > Authentication > Providers
2. 「Google」を有効化
3. Client ID と Client Secret を入力（Google Cloud Console から取得）
4. Redirect URL をコピー（後で使用）

### Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択
3. 「APIs & Services」 > 「OAuth consent screen」
   - User Type: External（または Internal for Workspace）
   - App name: SlideAI
   - User support email: あなたのメールアドレス
   - Authorized domains: `supabase.co` を追加
4. 「APIs & Services」 > 「Credentials」
   - 「Create Credentials」 > 「OAuth client ID」
   - Application type: Web application
   - Authorized redirect URIs: Supabase の Redirect URL を追加
5. 作成された Client ID と Client Secret を Supabase に設定

## 4. 環境変数の設定

`.env.local` ファイルを編集：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenRouter
OPENROUTER_API_KEY=sk-or-your-api-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase の認証情報の取得

1. Supabase Dashboard > Settings > API
2. 「Project URL」をコピー → `NEXT_PUBLIC_SUPABASE_URL`
3. 「anon public」キーをコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OpenRouter API キーの取得

1. [OpenRouter](https://openrouter.ai) にアクセス
2. アカウント作成後、API Keys から新しいキーを作成
3. キーをコピー → `OPENROUTER_API_KEY`

## 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 6. @dexall.co.jp ドメイン制限について

このアプリは `@dexall.co.jp` ドメインのユーザーのみログイン可能です。
制限を変更する場合は以下のファイルを編集：

- `src/app/auth/callback/route.ts` - ドメインチェックロジック
- `src/app/login/page.tsx` - Google OAuth の `hd` パラメータ

## トラブルシューティング

### 「unauthorized_domain」エラー
- @dexall.co.jp 以外のアカウントでログインしようとしています

### データベースエラー
- SQL マイグレーションが正しく実行されたか確認
- RLS (Row Level Security) が有効になっているか確認

### Google ログインが動作しない
- Google Cloud Console の Redirect URI が正しいか確認
- Supabase の Google Provider が有効か確認
