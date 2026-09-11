import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DOCS = resolve(ROOT, "docs");
const BASE = "/aqua-healing";
const STYLE_HREF = `${BASE}/assets/visual-enhancements.css`;
const SOURCE_ASSETS = resolve(ROOT, "assets");

const visuals = [
  { match: "メダカの病気異常", file: "health-medaka.jpg", alt: "水槽内を泳ぐメダカを観察するイメージ", caption: "メダカの状態をやさしく観察" },
  { match: "水草", file: "aquatic-plants.jpg", alt: "光が差し込む水槽で育つ緑の水草", caption: "水草がつくる健やかな水景" },
  { match: "アクアリウム用品", file: "aquarium-equipment.jpg", alt: "水草と照明を備えた落ち着いたアクアリウム", caption: "心地よい水景づくり" },
  { match: "メダカ用品", file: "medaka-supplies.jpg", alt: "メダカ水槽と日々のお手入れ用品", caption: "毎日の飼育を使いやすく" },
  { match: "飼育ノウハウ", file: "care-medaka.jpg", alt: "水草のある水槽で元気に泳ぐメダカ", caption: "実体験から学ぶ飼育の基本" }
];

await mkdir(resolve(DOCS, "assets", "generated"), { recursive: true });
await copyFile(resolve(SOURCE_ASSETS, "visual-enhancements.css"), resolve(DOCS, "assets", "visual-enhancements.css"));
for (const visual of [{ file: "hero-medaka.jpg" }, ...visuals]) {
  await copyFile(
    resolve(SOURCE_ASSETS, "generated", basename(visual.file)),
    resolve(DOCS, "assets", "generated", basename(visual.file))
  );
}

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

function visualFor(relativePath) {
  return visuals.find(({ match }) => relativePath.includes(match)) ?? {
    file: "hero-medaka.jpg",
    alt: "水草の間を泳ぐ色とりどりのメダカ",
    caption: "水景がくれる、やすらぎの時間"
  };
}

function stripTags(value) {
  return value
    .replace(/<!--.*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .trim();
}

function improveArticleStructure(html) {
  const copyStart = html.indexOf('<div class="article-copy">');
  if (copyStart < 0) return html;

  const firstHeading = html.indexOf("<h2", copyStart);
  if (firstHeading > copyStart && !html.slice(copyStart, firstHeading).includes('class="article-summary"')) {
    const contentStart = copyStart + '<div class="article-copy">'.length;
    const introduction = html.slice(contentStart, firstHeading);
    if (introduction.includes("<p")) {
      html = `${html.slice(0, contentStart)}<section class="article-summary">${introduction}</section>${html.slice(firstHeading)}`;
    }
  }

  const articleEnd = html.indexOf('<aside class="article-aside">', copyStart);
  if (articleEnd < 0) return html;
  let sectionNumber = 0;
  const headings = [];
  const article = html.slice(copyStart, articleEnd).replace(/<h2(?:\s+id="section-\d+")?>([\s\S]*?)<\/h2>/g, (match, label) => {
    sectionNumber += 1;
    const id = `section-${sectionNumber}`;
    headings.push({ id, label: stripTags(label) });
    return `<h2 id="${id}">${label}</h2>`;
  });
  html = `${html.slice(0, copyStart)}${article}${html.slice(articleEnd)}`;

  if (headings.length >= 2) {
    const links = headings.slice(0, 12).map(({ id, label }) => `<a href="#${id}">${label}</a>`).join("");
    const toc = `<nav class="visual-toc" aria-label="この記事の目次"><span>この記事の内容</span>${links}</nav>`;
    html = html.replace(/<aside class="article-aside">(?:<nav class="visual-toc"[\s\S]*?<\/nav>)?/, `<aside class="article-aside">${toc}`);
  }
  return html;
}

for (const file of await htmlFiles(DOCS)) {
  const path = relative(DOCS, file).split(sep).join("/");
  let html = await readFile(file, "utf8");
  if (!html.includes(STYLE_HREF)) {
    html = html.replace("</head>", `<link rel="stylesheet" href="${STYLE_HREF}"/></head>`);
  }

  if (path === "index.html" || path === "404.html") {
    html = html.replace('class="hero"', 'class="hero visual-home-hero"');
  } else if (!html.includes('class="visual-banner"')) {
    const visual = visualFor(decodeURIComponent(path));
    const figure = `<figure class="visual-banner"><img src="${BASE}/assets/generated/${visual.file}" alt="${visual.alt}" width="1536" height="1024" loading="eager" decoding="async"/><figcaption>${visual.caption}</figcaption></figure>`;
    html = html.replace(/(<section class="page-hero"[\s\S]*?<\/section>)/, `$1${figure}`);
  }
  html = improveArticleStructure(html);
  await writeFile(file, html, "utf8");
}

console.log("Applied responsive generated visuals to every published HTML page.");
