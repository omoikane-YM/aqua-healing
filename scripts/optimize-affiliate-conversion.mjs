import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const docsDir = fileURLToPath(new URL("../docs/", import.meta.url));
const marker = "data-affiliate-quick-guide";
const quickGuide = '<div class="affiliate-quick-guide" data-affiliate-quick-guide role="note" aria-label="記事内の商品案内"><div><small>この記事の商品案内</small><strong>紹介している商品を先に確認できます</strong><span>価格・在庫・仕様はAmazonの商品ページでご確認ください。</span></div><a href="#article-products">紹介商品を見る <span aria-hidden="true">↓</span></a></div>';
const trackingScript = '<script src="/assets/affiliate-click-tracking.js" defer data-affiliate-click-tracking></script>';
const shoppingShortcuts = '<section class="shopping-shortcuts" data-shopping-shortcuts aria-labelledby="shopping-shortcuts-title"><div class="container"><div><small>用品選びを先に確認</small><h2 id="shopping-shortcuts-title">目的に合う用品を探す</h2><p>実物画像、現在の仕様、価格、在庫はリンク先のAmazonで確認できます。</p></div><nav aria-label="用品選びの記事"><a href="/メダカ用品/初心者向けメダカ飼育セットおすすめ5選">初心者向け飼育セット <span>→</span></a><a href="/メダカ用品/メダカにおすすめの餌5選">メダカの餌 <span>→</span></a><a href="/メダカ用品/メダカ飼育で買ってよかったおすすめ用品初心者にもおすすめ">買ってよかった用品 <span>→</span></a><a href="/アクアリウム用品/濾過フィルターエアーポンプ">フィルター・エアーポンプ <span>→</span></a><a href="/アクアリウム用品/ヒーターledライト">ヒーター・LEDライト <span>→</span></a></nav></div></section>';

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtmlFiles(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

const htmlFiles = await listHtmlFiles(docsDir);
let changedPages = 0;

for (const file of htmlFiles) {
  const original = await readFile(file, "utf8");
  let html = original;
  if (file.endsWith("docs\\index.html") && !html.includes("data-shopping-shortcuts")) {
    html = html.replace('<section class="section" id="categories">', `${shoppingShortcuts}<section class="section" id="categories">`);
  }

  if (!html.includes('<div class="product-cards"') && !html.includes('<div class="product-cards">')) {
    if (html !== original) {
      await writeFile(file, html, "utf8");
      changedPages += 1;
    }
    continue;
  }

  if (!html.includes(marker)) {
    html = html.replace('<article class="article-body">', `<article class="article-body">${quickGuide}`);
  }
  if (!html.includes('id="article-products"')) {
    html = html.replace('<div class="product-cards">', '<div class="product-cards" id="article-products">');
  }
  if (!html.includes("data-affiliate-click-tracking")) {
    html = html.replace("</body>", `${trackingScript}</body>`);
  }
  html = html
    .replaceAll('>Amazonで見る <span>→</span></a>', '>Amazonで実物画像・最新情報を確認 <span>→</span></a>')
    .replaceAll('>Amazonで見る<!-- --> <span>→</span></a>', '>Amazonで実物画像・最新情報を見る<!-- --> <span>→</span></a>')
    .replaceAll('>商品の詳細・価格はこちら <span>→</span></a>', '>Amazonで商品の実物画像を確認 <span>→</span></a>')
    .replaceAll('をAmazonで見る"', 'の実物画像と最新情報をAmazonで確認"')
    .replaceAll('<span>権利に配慮したイメージ</span>', '<span>商品カテゴリのイメージ</span>');

  if (html !== original) {
    await writeFile(file, html, "utf8");
    changedPages += 1;
  }
}

console.log(`Affiliate conversion UI applied to ${changedPages} page(s).`);
