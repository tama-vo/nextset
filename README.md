# NextSet Prototype

サーバーなしで動く、セット完了チェック型のトレーニングメニューアプリです。

## できること

- 今日の分割メニューを表示
- 1セット終わるごとに完了ボタンを押す
- 目標セット数が終わった種目はグレーアウト
- 全セット完了後に一言コメントを残して、その日のメニューを完了
- 完了すると次のメニューに進む
- データはブラウザの localStorage に保存

## ファイル構成

- `index.html`: 画面
- `styles.css`: 見た目
- `app.js`: アプリの動き

## デプロイ方法

このフォルダをそのまま静的サイトとしてデプロイできます。

おすすめは Vercel / Netlify / GitHub Pages です。

### Vercel

1. GitHubにこのフォルダを含むリポジトリを作る
2. Vercelで「New Project」
3. GitHubリポジトリを選ぶ
4. Framework Preset は `Other`
5. Build Command は空
6. Output Directory は `outputs/nextset-prototype`
7. Deploy

### Netlify

1. Netlifyで「Add new site」
2. GitHubリポジトリを選ぶ
3. Build command は空
4. Publish directory は `outputs/nextset-prototype`
5. Deploy

## 次に足すとよさそうなもの

- カレンダー履歴
- 種目やセット数を自分で編集する画面
- スマホホーム画面に追加しやすいPWA対応
- Supabaseを使ったログインと友達機能
