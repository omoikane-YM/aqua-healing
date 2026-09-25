# CHANGELOG

## 2026-09-25

- 全36記事の「この記事の概要」へ、日常管理・繁殖・健康ケア・水草／用品の4テーマから内容に合う概要画像を追加。
- 概要画像はスマートフォンで本文幅に収まるレスポンシブ表示とし、alt、キャプション、遅延読み込みを設定。
- Codex画像生成スキルで、記事解説用4点（成長サイクル、健康観察、水草育成、コケ・グリーンウォーター比較）と商品カテゴリ用6点を制作。
- 全36記事へ内容に対応する解説画像を追加し、画像のalt、キャプション、遅延読み込みを設定。
- 全145商品カードを商品名の用途別に再分類し、LEDライトに餌画像が表示されるなどの不一致を解消。
- Amazonやメーカーの商品画像は転載せず、既存の商品名、紹介文、AmazonアソシエイトURL、ページURLを維持。
- 全44公開ページのSEO監査を実施し、構造化データ、canonical、meta description、内部リンク、画像altを確認。

## 2026-09-16

- Google Analytics 4 の Googleタグ（測定ID `G-BJV60JJ3BL`）を全公開ページの `head` 直後へ追加。
- 公開スナップショットの再生成後にも同じタグを重複なく再適用できるよう、共通整形スクリプトへ設定を追加。

## 2026-09-12

- 全44公開ページのタイトル、meta description、canonical、OGP、Twitter Cardを静的HTMLのhead内へ統一。
- 記事・カテゴリ・通常ページを区別した構造化データとBreadcrumbListを追加し、画面上のパンくずも「ホーム > カテゴリ > 記事」に改善。
- GitHub Pages版のサイトマップを正式な検査対象へ統一し、全ページのSEO要素を継続検査する自動監査スクリプトを追加。
- 一部記事の「この記事の概要」に誤って混入していたスキップリンク、サイト名、ナビゲーション文字列を削除。
- 同じ混入があった全9記事と検索・共有用の説明文を修正し、再生成時にも混入しないよう概要生成処理を改善。

## 2026-09-11

- Google Search Consoleのサイト所有権確認タグを新しい確認コードへ更新。
- Googleがサイト名とロゴを認識しやすいよう、トップページへWebSite・Organization構造化データを追加。
- 「バクテリア剤はこちら」の案内文を、内容に対応するおすすめバクテリア剤記事へリンク。
- 記事理解を補助する教育用図解として、窒素サイクル、水合わせ、部分換水、水温管理、健康観察の5画像をCodex画像生成スキルで制作。
- 関連する記事見出しへ図解、説明文、4段階のHTML補足ラベルを自動挿入。PCでは本文幅を広く使い、スマートフォンでは1カラム表示に変換。
- PC表示の本文領域を最大1,380pxへ拡張し、右側余白を記事目次として活用。
- 分断されていた記事導入文を「この記事の概要」カードへまとめ、段落間隔と本文幅を調整。
- 900px以下では1カラム、620px以下では従来相当の余白へ戻すレスポンシブ設計にし、スマートフォン表示を維持。
- Codex画像生成スキルで、トップ・飼育・病気／異常・水草・メダカ用品・アクアリウム用品の6種類の専用画像を制作。
- 全公開ページにレスポンシブなビジュアルを追加し、長文記事の導入部とカテゴリーの識別性を改善。
- 既存の商品画像、商品紹介文、AmazonアソシエイトURL、ページURL、SEOメタ情報は変更していない。
- `scripts/enhance-site-visuals.mjs` を追加し、スナップショット再生成後にも同じ画像構成を再適用できるようにした。

## 2026-09-11

- 変更内容: AI による安全な運営のための行動規則、正式情報、アフィリエイト規則、公開前チェックリスト、変更履歴、構造化データの初期版を追加。
- 対象ファイル: `AGENTS.md`, `SITE_FACTS.md`, `AFFILIATE_RULES.md`, `CHECKLIST.md`, `CHANGELOG.md`, `site-facts.json`
- 理由: サイト本体が未格納の現状で、確認できた事実だけを基に長期運用の管理基盤を準備するため。既存の表示・URL・Amazon リンク・SEO 設定は変更していない。
- 変更内容: 公開サイトで確認した正式情報を同期し、再インデックス登録用のサイトマップとクローラー設定を追加。
- 対象ファイル: `SITE_FACTS.md`, `site-facts.json`, `AGENTS.md`, `sitemap.xml`, `robots.txt`
- 理由: 公開済み 44 URL を変更せず GitHub 管理下に置き、検索エンジンへサイトマップを再送信できる基盤を用意するため。
- 変更内容: サイトマップの構文、重複、公開ホスト、robots 参照、全掲載 URL の応答を検査する GitHub Actions を追加。
- 対象ファイル: `.github/workflows/validate.yml`, `scripts/validate-site-map.mjs`
- 理由: 壊れたサイトマップを `main` へ反映しにくくし、公開前チェックを標準化するため。
- 変更内容: 正式商品データを基準にAmazon URLの到達性・リダイレクト・最終ドメインを低頻度で監視し、結果を4段階に分類する機能を追加。
- 対象ファイル: `affiliate-products.json`, `scripts/check-amazon-links.mjs`, `scripts/import-existing-amazon-links.mjs`, `.github/workflows/check-amazon-links.yml`, `AGENTS.md`, `AFFILIATE_RULES.md`, `CHECKLIST.md`
- 理由: Amazonリンクの異常を毎週検出し、明確なBROKENまたは3回連続UNKNOWNだけを重複なしでIssue通知するため。既存URLは変更しない。
- 変更内容: GitHub公式ActionsをNode.js 24対応版へ更新。
- 対象ファイル: `.github/workflows/check-amazon-links.yml`, `.github/workflows/validate.yml`
- 理由: GitHub ActionsのNode.js 20廃止警告を解消し、長期運用の安定性を確保するため。
- 変更内容: 公開中の44ページをGitHub Pages用の静的サイトとして `docs/` に生成するスナップショット処理を追加。
- 対象ファイル: `scripts/snapshot-public-site.mjs`, `docs/`, `AGENTS.md`
- 理由: 現在の表示・文章・画像・Amazonリンクを維持したまま、GitHub管理の公開サイトを作成するため。
- 変更内容: GitHub Pages URL、サイトマップURL、公開ディレクトリを正式情報とREADMEへ反映。
- 対象ファイル: `README.md`, `SITE_FACTS.md`, `site-facts.json`
- 理由: GitHub Pages版を正式なGitHub管理サイトとして公開するため。
