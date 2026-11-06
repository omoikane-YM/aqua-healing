import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const changedHtml = execFileSync("git", ["-c", "core.quotepath=false", "diff", "--name-only", "-z", "--", "docs/**/*.html"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const quickGuidePattern = /<div class="affiliate-quick-guide" data-affiliate-quick-guide[\s\S]*?<\/a><\/div>/;
const trackingPattern = /<script src="\/assets\/affiliate-click-tracking\.js" defer data-affiliate-click-tracking><\/script>/;

for (const path of changedHtml) {
  const before = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const after = await readFile(path, "utf8");
  const restored = after
    .replace(quickGuidePattern, "")
    .replace(' id="article-products"', "")
    .replace(trackingPattern, "");

  if (restored !== before) {
    throw new Error(`Unexpected editorial or link change detected: ${path}`);
  }
}

console.log(`Verified ${changedHtml.length} article page(s): only the approved conversion UI and analytics hook changed.`);
