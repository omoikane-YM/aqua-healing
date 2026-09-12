import { access, readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const docs = resolve(root, "docs");
const failures = [];
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name === "index.html" ? [path] : [];
  }))).flat();
}

function values(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function unique(map, value, path, label) {
  if (!value) return;
  if (map.has(value)) failures.push(`${path}: duplicate ${label} also used by ${map.get(value)}`);
  else map.set(value, path);
}

for (const file of await files(docs)) {
  const path = relative(docs, file).split(sep).join("/");
  const html = await readFile(file, "utf8");
  const pageTitles = values(html, /<title>([^<]+)<\/title>/g);
  const pageDescriptions = values(html, /<meta name="description" content="([^"]+)"\s*\/>/g);
  const pageCanonicals = values(html, /<link rel="canonical" href="([^"]+)"\s*\/>/g);
  const h1s = values(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g);
  const structured = values(html, /<script type="application\/ld\+json" data-page-seo>([\s\S]*?)<\/script>/g);

  for (const [label, found] of [["title", pageTitles], ["description", pageDescriptions], ["canonical", pageCanonicals], ["H1", h1s], ["page JSON-LD", structured]]) {
    if (found.length !== 1) failures.push(`${path}: expected one ${label}, found ${found.length}`);
  }
  unique(titles, pageTitles[0], path, "title");
  unique(descriptions, pageDescriptions[0], path, "description");
  unique(canonicals, pageCanonicals[0], path, "canonical");
  if (pageDescriptions[0]?.length < 45 || pageDescriptions[0]?.length > 160) failures.push(`${path}: description length is ${pageDescriptions[0]?.length ?? 0}`);
  if (pageCanonicals[0] && !pageCanonicals[0].startsWith("https://omoikane-ym.github.io/aqua-healing/")) failures.push(`${path}: invalid canonical host/path`);
  for (const json of structured) {
    try { JSON.parse(json); } catch { failures.push(`${path}: invalid page JSON-LD`); }
  }
  for (const image of html.matchAll(/<img\s+[^>]*>/g)) {
    if (!/\salt="[^"]*"/.test(image[0])) failures.push(`${path}: image without alt text`);
  }
  for (const match of html.matchAll(/<a\s+[^>]*href="([^"]+)"/g)) {
    const href = match[1].split("#")[0].split("?")[0];
    if (!href || !href.startsWith("/aqua-healing") || href.includes("/assets/")) continue;
    const local = decodeURIComponent(href.replace(/^\/aqua-healing\/?/, ""));
    const target = local ? resolve(docs, local, "index.html") : resolve(docs, "index.html");
    try { await access(target); } catch { failures.push(`${path}: broken internal link ${href}`); }
  }
}

if (failures.length) throw new Error(`SEO audit failed:\n${failures.join("\n")}`);
console.log(`SEO audit passed for ${titles.size} indexable HTML pages.`);
