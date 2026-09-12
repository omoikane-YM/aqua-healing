import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DOCS = resolve(ROOT, "docs");
const BASE = "/aqua-healing";
const STYLE_HREF = `${BASE}/assets/visual-enhancements.css`;
const SOURCE_ASSETS = resolve(ROOT, "assets");
const SITE_URL = "https://omoikane-ym.github.io/aqua-healing/";
const GOOGLE_SITE_VERIFICATION = "tyw1nVZOuPP1l_J-RyQC5CUH0oBVbeXsMvXVX2x2E8A";
const siteIdentityMarkup = `<script type="application/ld+json" data-site-identity>${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "Aqua Healing",
      alternateName: "アクアヒーリング",
      inLanguage: "ja"
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "Aqua Healing",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}favicon.png`,
        contentUrl: `${SITE_URL}favicon.png`,
        width: 512,
        height: 512
      }
    }
  ]
})}</script>`;

const visuals = [
  { match: "メダカの病気異常", file: "health-medaka.jpg", alt: "水槽内を泳ぐメダカを観察するイメージ", caption: "メダカの状態をやさしく観察" },
  { match: "水草", file: "aquatic-plants.jpg", alt: "光が差し込む水槽で育つ緑の水草", caption: "水草がつくる健やかな水景" },
  { match: "アクアリウム用品", file: "aquarium-equipment.jpg", alt: "水草と照明を備えた落ち着いたアクアリウム", caption: "心地よい水景づくり" },
  { match: "メダカ用品", file: "medaka-supplies.jpg", alt: "メダカ水槽と日々のお手入れ用品", caption: "毎日の飼育を使いやすく" },
  { match: "飼育ノウハウ", file: "care-medaka.jpg", alt: "水草のある水槽で元気に泳ぐメダカ", caption: "実体験から学ぶ飼育の基本" }
];

const explainerAssets = [
  "nitrogen-cycle.jpg",
  "water-acclimation.jpg",
  "partial-water-change.jpg",
  "water-temperature.jpg",
  "health-observation.jpg"
];

await mkdir(resolve(DOCS, "assets", "generated"), { recursive: true });
await copyFile(resolve(SOURCE_ASSETS, "visual-enhancements.css"), resolve(DOCS, "assets", "visual-enhancements.css"));
for (const visual of [{ file: "hero-medaka.jpg" }, ...visuals, ...explainerAssets.map((file) => ({ file }))]) {
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

function explainerMarkup({ key, file, alt, title, description, steps }) {
  const list = steps.map((step) => `<li>${step}</li>`).join("");
  return `<figure class="article-explainer" data-visual="${key}"><img src="${BASE}/assets/generated/${file}" alt="${alt}" width="1536" height="1024" loading="lazy" decoding="async"/><figcaption><strong>${title}</strong><span>${description}</span></figcaption><ol class="explainer-steps">${list}</ol></figure>`;
}

const explainers = [
  {
    key: "nitrogen-cycle",
    file: "nitrogen-cycle.jpg",
    alt: "水槽内で排泄物がバクテリアに分解され水草や換水へつながる循環図",
    title: "水槽の中で働く、ろ過バクテリアの循環",
    description: "排泄物や食べ残しから生じる物質は、ろ材や底床に定着したバクテリアの働きで段階的に変化します。最後は水草の栄養として使われたり、部分換水で水槽外へ排出されたりします。",
    steps: ["排泄物・食べ残し", "アンモニアから亜硝酸へ", "亜硝酸から硝酸塩へ", "水草の吸収・部分換水"],
    pattern: /(<p(?:\s+[^>]*)?>[^<]*(?:ろ過バクテリア|バクテリア剤)[^<]*<\/p>)/
  },
  {
    key: "water-acclimation",
    file: "water-acclimation.jpg",
    alt: "袋を浮かべる水温合わせから少量ずつ水を加えて移す水合わせの手順",
    title: "メダカを迎えるときの水温合わせ・水合わせ",
    description: "急な環境変化を避けるため、最初に水温を合わせ、次に飼育水を少量ずつ加え、最後はメダカだけを静かに移します。",
    steps: ["袋を浮かべて水温を近づける", "飼育水を少しずつ加える", "時間をかけて水質へ慣らす", "メダカだけを網で移す"],
    pattern: /(<h2 id="section-\d+">[^<]*(?:水温合わせ|水合わせ)[^<]*<\/h2>)/
  },
  {
    key: "partial-water-change",
    file: "partial-water-change.jpg",
    alt: "水槽の一部の水と底床の汚れを抜き準備した水をゆっくり戻す図",
    title: "環境を急変させない部分換水",
    description: "水をすべて交換せず、汚れを吸い出しながら一部だけ換えます。ろ材や水草を残すことで、水槽内の環境変化を抑えます。",
    steps: ["水量とメダカの様子を確認", "底床付近の汚れを吸い出す", "一度に全換水しない", "水温を近づけた水をゆっくり足す"],
    pattern: /(<h2 id="section-\d+">[^<]*(?:水換え|換水)[^<]*<\/h2>)/
  },
  {
    key: "water-temperature",
    file: "water-temperature.jpg",
    alt: "直射日光と冷暖房の風を避け水温を安定させる水槽管理図",
    title: "水温の急変を防ぐ置き場所と管理",
    description: "直射日光や冷暖房の風を避け、換水する水も飼育水に近い温度へ整えると、急激な温度変化を防ぎやすくなります。",
    steps: ["直射日光を避ける", "冷暖房の風を直接当てない", "水温計で毎日確認", "換水する水の温度も合わせる"],
    pattern: /(<h2 id="section-\d+">[^<]*(?:水温管理|冬越し|夏越し)[^<]*<\/h2>)/
  },
  {
    key: "health-observation",
    file: "health-observation.jpg",
    alt: "元気に泳ぐメダカと注意が必要な泳ぎ方や体表を比較する観察図",
    title: "毎日の観察で見るポイント",
    description: "泳ぎ方、群れとの距離、食欲、呼吸、ヒレや体表をいつもの状態と比べます。この図は観察点の例であり、病気を断定するものではありません。",
    steps: ["泳ぎ方と姿勢", "群れから離れていないか", "食欲と呼吸の様子", "ヒレ・体表の変化"],
    pattern: /(<h2 id="section-\d+">[^<]*(?:観察|症状|異常)[^<]*<\/h2>)/
  }
];

function addContextualLinks(html) {
  const bacteriaArticle = `${BASE}/アクアリウム用品/バクテリア剤`;
  return html
    .replace(
      /<p class="article-compact-line">(?:<a class="contextual-text-link"[^>]*>)?👉 私が実際におすすめしているバクテリア剤はこちら(?: <span aria-hidden="true">→<\/span>)?(?:<\/a>)?<\/p>/,
      `<p class="article-compact-line"><a class="contextual-text-link" href="${bacteriaArticle}">👉 私が実際におすすめしているバクテリア剤はこちら <span aria-hidden="true">→</span></a></p>`
    )
    .replace(
      /<p>詳しいレビューや使い方は、(?:<a class="contextual-text-link"[^>]*>)?こちらの記事(?:<\/a>)?でも紹介しています。<\/p>/,
      `<p>詳しいレビューや使い方は、<a class="contextual-text-link" href="${bacteriaArticle}">こちらの記事</a>でも紹介しています。</p>`
    );
}

function improveArticleStructure(html) {
  const copyStart = html.indexOf('<div class="article-copy">');
  if (copyStart < 0) return html;

  // The imported snapshot can contain accessibility/navigation text at the
  // beginning of article-copy. It is useful in the original app shell, but it
  // is not article content and must never be presented as an article summary.
  html = html.replace(
    /メイン コンテンツにスキップナビゲーションにスキップAqua Healingホーム🐟 メダカ用品🐠 アクアリウム用品📖 飼育ノウハウ🐟 メダカの病気・異常その他/g,
    ""
  );
  html = html.replace(
    /(<section class="article-summary">|<div class="article-copy">)\s*<p class="lead">メイン コンテンツにスキップ<\/p><p>ナビゲーションにスキップ<\/p><p class="article-compact-line">Aqua Healing<\/p><p>ホーム🐟 メダカ用品🐠 アクアリウム用品📖 飼育ノウハウ🐟 メダカの病気・異常その他<\/p>/g,
    "$1"
  );

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
  let article = html.slice(copyStart, articleEnd)
    .replace(/<figure class="article-explainer"[\s\S]*?<\/figure>/g, "")
    .replace(/<h2(?:\s+id="section-\d+")?>([\s\S]*?)<\/h2>/g, (match, label) => {
    sectionNumber += 1;
    const id = `section-${sectionNumber}`;
    headings.push({ id, label: stripTags(label) });
    return `<h2 id="${id}">${label}</h2>`;
  });
  let inserted = 0;
  for (const explainer of explainers) {
    if (inserted >= 4 || article.includes(`data-visual="${explainer.key}"`) || !explainer.pattern.test(article)) continue;
    article = article.replace(explainer.pattern, `$1${explainerMarkup(explainer)}`);
    inserted += 1;
  }
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
  html = html.replace(
    /<meta name="google-site-verification" content="[^"]*"\s*\/?>/g,
    `<meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}"/>`
  );
  if (!html.includes(STYLE_HREF)) {
    html = html.replace("</head>", `<link rel="stylesheet" href="${STYLE_HREF}"/></head>`);
  }

  if (path === "index.html" || path === "404.html") {
    html = html.replace('class="hero"', 'class="hero visual-home-hero"');
    if (path === "index.html" && !html.includes("data-site-identity")) {
      html = html.replace("</head>", `${siteIdentityMarkup}</head>`);
    }
  } else if (!html.includes('class="visual-banner"')) {
    const visual = visualFor(decodeURIComponent(path));
    const figure = `<figure class="visual-banner"><img src="${BASE}/assets/generated/${visual.file}" alt="${visual.alt}" width="1536" height="1024" loading="eager" decoding="async"/><figcaption>${visual.caption}</figcaption></figure>`;
    html = html.replace(/(<section class="page-hero"[\s\S]*?<\/section>)/, `$1${figure}`);
  }
  html = improveArticleStructure(html);
  html = addContextualLinks(html);
  await writeFile(file, html, "utf8");
}

console.log("Applied responsive generated visuals to every published HTML page.");
