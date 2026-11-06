import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const changedHtml = execFileSync("git", ["-c", "core.quotepath=false", "diff", "--name-only", "-z", "--", "docs/*.html", "docs/**/*.html"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const shoppingShortcutsPattern = /<section class="shopping-shortcuts" data-shopping-shortcuts[\s\S]*?<\/nav><\/div><\/section>/;

for (const path of changedHtml) {
  const before = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const after = await readFile(path, "utf8");
  const restored = after
    .replace(shoppingShortcutsPattern, "")
    .replaceAll('>Amazonで実物画像・最新情報を確認 <span>→</span></a>', '>Amazonで見る <span>→</span></a>')
    .replaceAll('>Amazonで実物画像・最新情報を見る<!-- --> <span>→</span></a>', '>Amazonで見る<!-- --> <span>→</span></a>')
    .replaceAll('>Amazonで商品の実物画像を確認 <span>→</span></a>', '>商品の詳細・価格はこちら <span>→</span></a>')
    .replaceAll('の実物画像と最新情報をAmazonで確認"', 'をAmazonで見る"')
    .replaceAll('<span>商品カテゴリのイメージ</span>', '<span>権利に配慮したイメージ</span>');

  if (restored !== before) {
    throw new Error(`Unexpected editorial or link change detected: ${path}`);
  }
}

console.log(`Verified ${changedHtml.length} page(s): only approved shopping UI labels and navigation changed.`);
