# CHANGELOG

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
