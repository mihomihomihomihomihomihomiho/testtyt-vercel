# web3/AI概論 公式サイト

最新テクノロジーを実践で学ぶ、大学発プロジェクト型コミュニティの公式ウェブサイト

## 機能

- プロジェクト紹介
- ニュース・イベント情報
- パートナー企業紹介
- コンタクトフォーム（Airtable連携）

## コンタクトフォームのセットアップ

コンタクトフォームはAirtableと連携しており、送信されたデータはAirtableのテーブルに自動保存されます。

### 1. Airtableの準備

#### 1.1 Airtableでベースとテーブルを作成

1. [Airtable](https://airtable.com/)にログイン
2. 新しいベースを作成（または既存のベースを使用）
3. テーブルを作成し、以下のフィールドを設定:
   - `Name` (Single line text)
   - `Email` (Email)
   - `Category` (Single select)
   - `Message` (Long text)
   - `Submitted` (Date and time)

> **注意**: フィールド名は `api/contact.js` の52-57行目で定義されています。Airtableのフィールド名と一致するように調整してください。

#### 1.2 Personal Access Tokenの作成

1. [Airtable Token作成ページ](https://airtable.com/create/tokens)にアクセス
2. 「Create new token」をクリック
3. トークン名を入力（例: "Contact Form Integration"）
4. スコープで以下を選択:
   - `data.records:write`
5. 対象のベースを選択
6. 「Create token」をクリックし、トークンをコピー

#### 1.3 Base IDとTable Nameの取得

- **Base ID**: Airtableで該当のベースを開き、URLから取得
  - 例: `https://airtable.com/appXXXXXXXXXXXXXX/...` の `appXXXXXXXXXXXXXX` 部分
- **Table Name**: テーブルの名前（例: "Contacts"、"お問い合わせ" など）

### 2. ローカル環境でのセットアップ

1. `.env.local.example` をコピーして `.env.local` を作成:
   ```bash
   cp .env.local.example .env.local
   ```

2. `.env.local` に取得した値を設定:
   ```env
   AIRTABLE_TOKEN=patXXXXXXXXXXXXXX
   AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
   AIRTABLE_TABLE_NAME=Contacts
   ```

3. ローカルで動作確認（Vercel CLIを使用）:
   ```bash
   npm i -g vercel
   vercel dev
   ```

### 3. Vercelへのデプロイ

#### 3.1 環境変数の設定

1. [Vercel](https://vercel.com/)にログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」に移動
4. 以下の環境変数を追加:
   - `AIRTABLE_TOKEN`
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_TABLE_NAME`

#### 3.2 デプロイ

```bash
# Vercel CLIでデプロイ
vercel

# または、GitHubと連携している場合はpushするだけで自動デプロイ
git add .
git commit -m "Add Airtable integration"
git push
```

## プロジェクト構成

```
.
├── index.html          # トップページ
├── contact.html        # お問い合わせページ
├── chibatech.html      # Chibatechページ
├── business.html       # 法人向けページ
├── partners.html       # パートナーページ
├── news.html          # ニュースページ
├── reading.html       # リーディングページ
├── project.html       # プロジェクトページ
├── api/
│   └── contact.js     # コンタクトフォーム用サーバーレス関数
├── .env.local.example # 環境変数テンプレート
├── .gitignore         # Git除外設定
└── README.md          # このファイル
```

## トラブルシューティング

### フォーム送信時にエラーが発生する場合

1. **環境変数の確認**
   - Vercelの環境変数が正しく設定されているか確認
   - `.env.local`（ローカル環境）に正しい値が入っているか確認

2. **Airtableのフィールド名を確認**
   - `api/contact.js` の52-57行目のフィールド名がAirtableのテーブルと一致しているか確認

3. **Airtableのトークン権限を確認**
   - Personal Access Tokenに `data.records:write` 権限があるか確認
   - トークンが対象のベースにアクセスできるか確認

4. **ブラウザのコンソールを確認**
   - F12キーでデベロッパーツールを開き、エラーメッセージを確認

## ライセンス

© 2025 web3/AI概論. All rights reserved.
