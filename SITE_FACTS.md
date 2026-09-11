# aqua-healing 現在の正式情報

確認基準日: 2026-09-11

## 確認範囲

- GitHub リポジトリ: `https://github.com/omoikane-YM/aqua-healing`
- ブランチ: `main`
- 確認時コミット: `8b04a28` (`Initial commit`)
- リポジトリ内の既存ファイル: `README.md` のみ
- GitHub Pages URL: `https://omoikane-ym.github.io/aqua-healing/`
- 移行元サイト URL: `https://aqua-healing.gdaye311.chatgpt.site/`

## サイト名

aqua-healing（リポジトリ名および `README.md` の見出しから確認）

## サイト概要

メダカ、水草、アクアリウム用品の選び方と育て方を、実際の飼育経験をもとに初心者向けに紹介するサイト。

## 技術構成

公開サイトは `/_next/static/` 配下の JavaScript と CSS を配信しており、Next.js 系の生成物であることを確認した。ただし、フレームワークのバージョン、ソースコード、`package.json`、ビルド方法は現在のリポジトリに含まれていないため未確認。GitHub Actions と GitHub Pages 設定も存在しない。

## Amazon アソシエイト

- 参加: 公開サイトの参加表記から確認
- 参加表記: 「Amazonのアソシエイトとして、Aqua Healingは適格販売により収入を得ています。」
- アソシエイト ID: 未確認（記録していない）
- アソシエイトリンク: トップページには直接の Amazon リンクなし。商品記事内は未確認

## 商品管理

公開サイトから既存のAmazon商品リンク159件を文字列変更なしで `affiliate-products.json` に登録。商品名は現在のコードから確認できないため、仮の管理名と掲載元ページだけを記録している。商品紹介本文と商品画像はリポジトリに未格納。

## 問い合わせ

公開サイトに `/お問い合わせ` への導線がある。問い合わせ方法と送信先は未確認。

## SNS

現在のコードから確認できない。

## 免責事項

公開サイトのトップページには独立した免責事項への導線を確認できない。

## プライバシーポリシー

公開サイトに `/プライバシーポリシー` への導線がある。本文は未確認。

## SEO と公開設定

- トップページ title: `Aqua Healing｜メダカとアクアリウムの飼育情報`
- meta description: `実際の飼育経験をもとに、メダカ・水草・アクアリウム用品の選び方と育て方を初心者にも分かりやすく紹介します。`
- OGP: title、description、type、locale、image を確認
- canonical: トップページでは確認できない
- `robots.txt`: 全クローラーを許可し、公開サイトの `sitemap.xml` を指定
- `sitemap.xml`: 44 URL を掲載
- 公開基盤: GitHub Pages（`main` ブランチの `/docs`）。移行元の `chatgpt.site` は変更していない

## 更新時の注意

元サイト一式または正しい公開 URL が提供された時点で、実装上の事実と照合して本ファイルおよび `site-facts.json` を更新する。差異がある場合は自動統一せず「差異あり」として報告する。
