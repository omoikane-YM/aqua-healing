import { readFile } from "node:fs/promises";

const expectedOrigin = "https://aqua-healing.gdaye311.chatgpt.site";
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
  throw new Error("sitemap.xml does not use the sitemap protocol namespace.");
}

if (urls.length === 0) {
  throw new Error("sitemap.xml contains no URLs.");
}

if (new Set(urls).size !== urls.length) {
  throw new Error("sitemap.xml contains duplicate URLs.");
}

for (const value of urls) {
  const url = new URL(value);
  if (url.origin !== expectedOrigin) {
    throw new Error(`Unexpected sitemap origin: ${url.origin}`);
  }
}

const sitemapUrl = `${expectedOrigin}/sitemap.xml`;
if (!robots.includes(`Sitemap: ${sitemapUrl}`)) {
  throw new Error(`robots.txt must reference ${sitemapUrl}`);
}

const failures = [];
for (const value of urls) {
  try {
    const response = await fetch(value, { method: "HEAD", redirect: "follow" });
    if (!response.ok) failures.push(`${response.status} ${value}`);
  } catch (error) {
    failures.push(`${error.message} ${value}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Unreachable sitemap URLs:\n${failures.join("\n")}`);
}

console.log(`Validated ${urls.length} unique sitemap URLs on ${expectedOrigin}.`);
