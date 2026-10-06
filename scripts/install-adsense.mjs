import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docs = path.join(root, "docs");
const client = "ca-pub-3734732668384938";
const snippet = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`;

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (entry.name.endsWith(".html")) files.push(target);
  }
  return files;
}

let updated = 0;
for (const file of await htmlFiles(docs)) {
  const source = await readFile(file, "utf8");
  if (source.includes(client)) continue;
  if (!source.includes("<head>")) throw new Error(`Missing <head>: ${file}`);
  await writeFile(file, source.replace("<head>", `<head>${snippet}`));
  updated += 1;
}

console.log(`Installed AdSense code in ${updated} HTML files.`);
