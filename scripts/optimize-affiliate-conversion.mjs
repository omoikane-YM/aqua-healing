import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const docsDir = fileURLToPath(new URL("../docs/", import.meta.url));
const marker = "data-affiliate-quick-guide";
const quickGuide = '<div class="affiliate-quick-guide" data-affiliate-quick-guide role="note" aria-label="記事内の商品案内"><div><small>この記事の商品案内</small><strong>紹介している商品を先に確認できます</strong><span>価格・在庫・仕様はAmazonの商品ページでご確認ください。</span></div><a href="#article-products">紹介商品を見る <span aria-hidden="true">↓</span></a></div>';
const trackingScript = '<script src="/assets/affiliate-click-tracking.js" defer data-affiliate-click-tracking></script>';

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
  if (!original.includes('<div class="product-cards">')) continue;

  let html = original;
  if (!html.includes(marker)) {
    html = html.replace('<article class="article-body">', `<article class="article-body">${quickGuide}`);
  }
  if (!html.includes('id="article-products"')) {
    html = html.replace('<div class="product-cards">', '<div class="product-cards" id="article-products">');
  }
  if (!html.includes("data-affiliate-click-tracking")) {
    html = html.replace("</body>", `${trackingScript}</body>`);
  }

  if (html !== original) {
    await writeFile(file, html, "utf8");
    changedPages += 1;
  }
}

console.log(`Affiliate conversion UI applied to ${changedPages} page(s).`);
