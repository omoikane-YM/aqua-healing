import { readFile, writeFile } from "node:fs/promises";

const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const links = new Map();

for (const page of pages) {
  const response = await fetch(page, { headers: { "user-agent": "aqua-healing-link-inventory/1.0" } });
  if (!response.ok) throw new Error(`Could not inventory ${page}: HTTP ${response.status}`);
  const html = await response.text();
  const pattern = /href=["'](https?:\/\/(?:[^"']*\.)?(?:amazon\.[^/"']+|amzn\.to|link\.amazon)\/[^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const amazonUrl = match[1].replaceAll("&amp;", "&");
    const parsed = new URL(amazonUrl);
    const isShortProductLink = parsed.hostname === "link.amazon" || parsed.hostname === "amzn.to";
    const isDirectProductLink = /\/(?:dp|gp\/product)\//.test(parsed.pathname);
    if (!isShortProductLink && !isDirectProductLink) continue;
    if (!links.has(amazonUrl)) links.set(amazonUrl, page);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const products = [...links.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([amazon_url, source_page], index) => ({
  id: `existing-amazon-link-${String(index + 1).padStart(3, "0")}`,
  title: `既存Amazonリンク ${String(index + 1).padStart(3, "0")}`,
  amazon_url,
  source_page,
  enabled: true,
  verification: "URL文字列と掲載元ページのみ公開サイトから確認。商品名は未確認。"
}));

const output = {
  schema_version: 1,
  source: "One-time inventory from the published site; monitoring reads this file and does not scrape HTML.",
  products
};

await writeFile(new URL("../affiliate-products.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Imported ${products.length} unchanged Amazon URLs into affiliate-products.json.`);
