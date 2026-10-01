# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 作業ルール

- ユーザーへの返答・説明は日本語で行うこと。
- コード内のコメントは日本語で書くこと。
- コードの作成・編集やコマンドの実行など、Claude Code 自身で実行できる作業はユーザーに手順を渡さず、自分で実行すること。
- 認証（ログイン、APIキー・トークンの入力、`gh auth login` や `gcloud auth login` など）が必要な操作は勝手に実行せず、実行前にユーザーに確認すること。

## Project Status

自分専用の iPhone 向け育児記録アプリ（PWA）。要件は `requirements.md` にある（オンライン版の要件定義書と同じ内容）。ユーザーはプログラミング初心者なので、説明では専門用語をかみ砕くこと。

次の順で作っていく：
1. 骨組み（完了） → 2. ホーム画面と記録ボタン（完了） → 3. まとめ画面（完了） → 4. 設定・予防接種画面（完了） → 5. 成長画面（グラフ）（完了） → 6. バックアップ（完了） → 7. 公開（完了）

公開先：https://baby-log-e1o.pages.dev/ （Cloudflare Pages のプロジェクト `baby-log`）

GitHub：https://github.com/bobmoe54145-lab/baby-log （公開リポジトリ）。**誰でも見られるので、個人情報（子どもの名前・誕生日・メールアドレスなど）や鍵をコミットしないこと。** push は外に出る操作なので、ユーザーに確認してから行う。

## Commands

- `npm run dev` — 開発用サーバーを起動（http://127.0.0.1:5173 。この環境では localhost だと開けないことがある）
- `npm run build` — 型チェック（`tsc -b`）と本番用のビルド
- `npm run lint` — oxlint によるチェック
- `npm run preview -- --port 4173 --strictPort --host 127.0.0.1` — 本番用に組み立てたもの（`dist`）を動かす。PWA（オフライン動作）の確認はこちらで行う（開発用サーバーではサービスワーカーが動かない）
- `npm run deploy` — 組み立てて Cloudflare Pages に公開する（`wrangler pages deploy`）。**公開は外に出る操作なので、ユーザーに確認してから実行する。** Cloudflare へのログイン（`wrangler login`）はユーザー本人が行う
- テストはまだない

Cloudflare の注意：`wrangler pages project create` は新しい Workers へ自動で切り替えようとし、失敗すると `vite.config.ts`・`package.json`・`wrangler.jsonc` を勝手に書き換える。プロジェクトはすでに作ってあるので、もう `create` や `--force` は使わず、`npm run deploy` だけ使う。

## 動作確認のルール（重要）

- ユーザーは 5173 番（http://127.0.0.1:5173）を Chrome で実際に使っており、本物の記録が入っている。**5173 番のブラウザのデータには、確認用の記録を入れたり消したりしないこと。**（2026-09-29 に、ユーザーが登録した赤ちゃんの情報を確認用データで上書きしてしまった）
- 確認用のデータが必要なときは、別の番号でサーバーを起動する（例：`npm run dev -- --port 5174 --strictPort --host 127.0.0.1`）。番号が違うとブラウザの保存場所が分かれる。書き込む前に `location.port` とデータが空であることを確かめ、終わったらそのデータベースを消してサーバーを止める。

## Architecture

- Vite + React + TypeScript。画面の切り替えはルーターを使わず、`src/App.tsx` の state（`tab` と `showSettings`）で行う。
- 画面は `src/screens/` に1画面1ファイル。下のタブは ホーム／まとめ／成長／予防接種 の4つで、設定画面はホームの ⚙ から開く。
- 色は `src/index.css` の `:root` の CSS 変数で定義し、`prefers-color-scheme: dark` でダークモード用に切り替える。
- データは IndexedDB に端末内保存（サーバーなし）。`src/db.ts` で Dexie を使って定義し、お世話の記録はすべて1つの `records` テーブルに `type` で区別して入れる。画面は `dexie-react-hooks` の `useLiveQuery` で読むので、保存すると表示が自動で更新される。
- まとめ画面は、左に選んだ日のまとめ・右に `MonthCalendar.tsx`。「この日の記録を見る」から開く1日分の一覧は `src/screens/DayRecordsScreen.tsx`、記録の修正・削除は `EditRecordSheet.tsx`。症状の選択肢は `src/constants.ts`。
- ホームの入力パネル（ミルクの量・体温・症状）は `src/components/` の `*Sheet.tsx`、記録直後の「取り消す」は `Toast.tsx`。
- 子どもの情報は `settings` テーブルに id `'child'` の1件だけ保存し、`src/hooks/useChild.ts` の `useChild` / `useSchedule` で読む。予防接種は、予約済み・接種済みの回だけ `vaccinations` テーブルに保存する（何もしていない回は保存しない）。
- 予防接種のルールは `src/data/vaccines.ts`（出典は厚生労働省、`requirements.md` の7章）。`until` は「期限の翌日」（この日より前に受ける）という決まりで、表示するときに1日戻す。状態の計算は `src/vaccineSchedule.ts`。
- IndexedDB の形を変えるときは `src/db.ts` に `db.version(n)` を追加する（既存の版は書き換えない）。
- バックアップは `src/backup.ts`。全テーブルを1つの JSON（`app: 'baby-log'`, `formatVersion: 1`）に書き出し、読み込みは全テーブルを消してから入れ直す（1つのトランザクション）。**テーブルを追加・変更したら、ここの書き出し・読み込みと `formatVersion` も直すこと。**
- PWA の設定（アプリ名・アイコン・オフライン用のサービスワーカー）は `vite.config.ts` の `VitePWA`。アイコンの元は `public/icons/icon.svg` で、PNG は macOS の `qlmanage -t -s <大きさ> -o . icon.svg` で作った。
- 成長曲線は Chart.js を使わず、`src/components/GrowthChart.tsx` で SVG を自分で描いている。基準値は `src/data/growthStandards.ts`（こども家庭庁 令和5年調査、e-Stat 表1・表2）。区間の値は区間の真ん中の月齢に置く（理由はファイル内のコメント）。健診の記録は `checkups` テーブル。
