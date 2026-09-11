import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");
const OUTPUT = resolve(ROOT, "docs");
const SOURCE_ORIGIN = "https://aqua-healing.gdaye311.chatgpt.site";
const PAGES_ORIGIN = "https://omoikane-ym.github.io";
const BASE_PATH = "/aqua-healing";
const sitemap = await readFile(resolve(ROOT, "sitemap.xml"), "utf8");
const pageUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const assetUrls = new Set();
const execFileAsync = promisify(execFile);

function outputPathForPage(urlString) {
  const { pathname } = new URL(urlString);
  if (pathname === "/") return join(OUTPUT, "index.html");
  return join(OUTPUT, ...decodeURIComponent(pathname).split("/").filter(Boolean), "index.html");
}

function collectAssets(html) {
  for (const match of html.matchAll(/(?:href|src)=["'](\/[^"']+)["']/gi)) {
    const pathname = match[1].split(/[?#]/, 1)[0];
    if (pathname.startsWith("/_next/static/css/") || /\.(?:css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf)$/i.test(pathname)) {
      assetUrls.add(new URL(match[1], SOURCE_ORIGIN).href);
    }
  }
}

function rewriteHtml(html, sourceUrl) {
  const { pathname } = new URL(sourceUrl);
  const canonical = `${PAGES_ORIGIN}${BASE_PATH}${pathname === "/" ? "/" : pathname}`;
  let output = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*\/?>/gi, "")
    .replaceAll(SOURCE_ORIGIN, `${PAGES_ORIGIN}${BASE_PATH}`)
    .replace(/\b(href|src|action)=(['"])\/(?!\/)/gi, `$1=$2${BASE_PATH}/`)
    .replace(/url\((['"]?)\/(?!\/)/gi, `url($1${BASE_PATH}/`);
  const existingCanonical = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  output = existingCanonical.test(output)
    ? output.replace(existingCanonical, `<link rel="canonical" href="${canonical}"/>`)
    : output.replace("</head>", `<link rel="canonical" href="${canonical}"/></head>`);
  return output;
}

async function downloadAsset(assetUrl) {
  const response = await fetch(assetUrl, { headers: { "user-agent": "aqua-healing-github-migration/1.0" } });
  if (!response.ok) throw new Error(`Asset failed: HTTP ${response.status} ${assetUrl}`);
  const sourcePath = new URL(assetUrl).pathname;
  const destination = join(OUTPUT, ...decodeURIComponent(sourcePath).split("/").filter(Boolean));
  let content = Buffer.from(await response.arrayBuffer());
  if (sourcePath.endsWith(".css")) {
    const css = content.toString("utf8");
    for (const match of css.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/gi)) {
      if (match[2].startsWith("data:")) continue;
      const nested = new URL(match[2], assetUrl);
      if (nested.origin === SOURCE_ORIGIN) assetUrls.add(nested.href);
    }
    content = Buffer.from(css.replace(/url\((['"]?)\/(?!\/)/gi, `url($1${BASE_PATH}/`), "utf8");
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content);
}

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });

for (const [index, url] of pageUrls.entries()) {
  const response = await fetch(url, { headers: { "user-agent": "aqua-healing-github-migration/1.0" } });
  if (!response.ok) throw new Error(`Page failed: HTTP ${response.status} ${url}`);
  const html = await response.text();
  collectAssets(html);
  const destination = outputPathForPage(url);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, rewriteHtml(html, url), "utf8");
  console.log(`[${index + 1}/${pageUrls.length}] ${new URL(url).pathname}`);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
}

for (const assetUrl of assetUrls) await downloadAsset(assetUrl);

const pagesSitemap = sitemap.replaceAll(SOURCE_ORIGIN, `${PAGES_ORIGIN}${BASE_PATH}`);
const pagesRobots = `User-Agent: *\nAllow: /\n\nHost: ${PAGES_ORIGIN}${BASE_PATH}\nSitemap: ${PAGES_ORIGIN}${BASE_PATH}/sitemap.xml\n`;
await Promise.all([
  writeFile(resolve(OUTPUT, "sitemap.xml"), pagesSitemap, "utf8"),
  writeFile(resolve(OUTPUT, "robots.txt"), pagesRobots, "utf8"),
  writeFile(resolve(OUTPUT, ".nojekyll"), "", "utf8"),
  writeFile(resolve(OUTPUT, "404.html"), await readFile(resolve(OUTPUT, "index.html"), "utf8"), "utf8")
]);

await execFileAsync(process.execPath, [resolve(ROOT, "scripts", "enhance-site-visuals.mjs")]);

console.log(`Created GitHub Pages snapshot: ${pageUrls.length} pages, ${assetUrls.size} local assets.`);
