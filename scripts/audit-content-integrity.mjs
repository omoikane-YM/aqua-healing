import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DOCS = resolve(ROOT, "docs");

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  }));
  return nested.flat();
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function productVisual(title) {
  if (/(?:LED|ライト|照明|FLORA|フラッティ)/i.test(title)) return "lighting";
  if (/(?:ヒーター|サーモ)/.test(title)) return "heater";
  if (/(?:フィルター|濾過|ろ過|エアー|ポンプ|ブクブク)/.test(title)) return "filtration";
  if (/(?:餌|エサ|フード|ブライン|ミジンコ|ゾウリムシ)/.test(title)) return "food";
  if (/(?:水草|ソイル|底床|砂利|砂|石|流木|モス|アナカリス|マツモ|アヌビアス)/.test(title)) return "plants";
  return "care";
}

const failures = [];
let productCards = 0;
const htmlFiles = (await files(DOCS)).filter((file) => file.endsWith(".html"));

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const label = relative(DOCS, file);

  if (/�|繧|譁|縺|螟|荳|髫|蜿|驥|陦/.test(html)) {
    failures.push(`${label}: 文字化けの可能性がある文字列`);
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    const attributes = match[1];
    const src = attributes.match(/src="([^"]+)"/)?.[1];
    if (!/\balt="[^"]*"/.test(attributes)) failures.push(`${label}: altなし ${src ?? "unknown image"}`);
    if (!src?.startsWith("/aqua-healing/")) continue;
    const target = join(DOCS, decodeURIComponent(src.slice("/aqua-healing/".length)));
    if (!existsSync(target)) failures.push(`${label}: 画像参照切れ ${src}`);
  }

  for (const match of html.matchAll(/href="(\/aqua-healing(?:\/[^"#?]*)?)"/g)) {
    const href = match[1];
    const relativeTarget = decodeURIComponent(href.replace(/^\/aqua-healing\/?/, ""));
    let target = join(DOCS, relativeTarget);
    if (!extname(target)) target = join(target, "index.html");
    if (!existsSync(target)) failures.push(`${label}: 内部リンク切れ ${href}`);
  }

  for (const match of html.matchAll(/<section class="product-card">([\s\S]*?)<\/section>/g)) {
    productCards += 1;
    const card = match[1];
    const title = stripTags(card.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? "");
    const actual = card.match(/product-visual-([a-z]+)/)?.[1];
    const expected = productVisual(title);
    if (actual !== expected) failures.push(`${label}: 商品画像不一致「${title}」 expected=${expected} actual=${actual}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Content integrity audit passed: ${htmlFiles.length} HTML pages, ${productCards} product cards.`);
}
