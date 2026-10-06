import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docs = path.join(root, "docs");
const privacyPath = path.join(docs, "プライバシーポリシー", "index.html");

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

let privacy = await readFile(privacyPath, "utf8");
privacy = privacy
  .replace(
    /<meta name="description" content="[^"]*"\/>/,
    '<meta name="description" content="Aqua Healingの個人情報、Cookie、Google Analytics、Google AdSense、Amazonアソシエイト等の取扱いを定めたプライバシーポリシーです。"/>'
  )
  .replace(
    /<meta property="og:description" content="[^"]*"\/>/,
    '<meta property="og:description" content="Aqua Healingの個人情報、Cookie、アクセス解析、広告配信等の取扱いについてご案内します。"/>'
  )
  .replace(
    /<meta name="twitter:description" content="[^"]*"\/>/,
    '<meta name="twitter:description" content="Aqua Healingの個人情報、Cookie、アクセス解析、広告配信等の取扱いについてご案内します。"/>'
  )
  .replace(
    '<h2>Cookie・アクセス解析</h2><p>当サイトでは、利便性の向上や閲覧状況の分析のため、Cookie等の技術を利用する場合があります。Cookieはブラウザの設定から無効にできますが、一部の機能が正常に利用できなくなる場合があります。アクセス解析サービスを導入する場合、その提供事業者がCookie等を利用して個人を直接特定しない形で情報を収集することがあります。</p>',
    '<h2>Cookieについて</h2><p>当サイトでは、サイトの利用状況の把握、利便性の向上、広告の配信および効果測定のため、Cookieや類似の技術を使用します。Cookieによりブラウザを識別することはありますが、当サイトがCookieだけで氏名や住所等の個人を直接特定する情報を取得するものではありません。</p><p>Cookieはブラウザの設定で削除または無効化できます。ただし、無効化すると一部の機能や表示が正常に動作しない場合があります。</p><h2>Google Analytics</h2><p>当サイトは、サイトの利用状況を把握し改善するためにGoogle Analyticsを利用しています。Google AnalyticsはCookie等を使用し、閲覧ページ、利用環境、参照元、IPアドレス等の情報を収集することがあります。収集された情報はGoogleの規約およびプライバシーポリシーに基づいて管理されます。</p><p><a class="text-link" href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer">Google Analytics利用規約を確認する →</a><br/><a class="text-link" href="https://policies.google.com/privacy?hl=ja" target="_blank" rel="noopener noreferrer">Googleプライバシーポリシーを確認する →</a><br/><a class="text-link" href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer">Google Analyticsオプトアウト アドオンを確認する →</a></p><h2>Google AdSenseによる広告配信</h2><p>当サイトでは、第三者配信の広告サービス「Google AdSense」を利用します。Googleなどの第三者配信事業者はCookieを使用し、利用者が当サイトや他のサイトへ過去にアクセスした情報に基づいて広告を配信することがあります。Googleが広告Cookieを使用することにより、Googleおよびそのパートナーは、当サイトや他のサイトへのアクセス情報に基づいた広告を利用者に表示できます。</p><p>利用者は、Googleの広告設定でパーソナライズ広告を無効にできます。また、第三者配信事業者によるパーソナライズ広告のCookieは、AboutAdsのオプトアウトページから無効にできる場合があります。</p><p><a class="text-link" href="https://adssettings.google.com/authenticated?hl=ja" target="_blank" rel="noopener noreferrer">Google広告設定を確認する →</a><br/><a class="text-link" href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">AboutAdsのオプトアウトを確認する →</a><br/><a class="text-link" href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer">Googleの広告で使用される技術を確認する →</a></p><h2>広告配信に関する同意</h2><p>欧州経済領域（EEA）、英国およびスイス等、同意取得が必要な地域の利用者に対しては、Google認定の同意管理プラットフォーム（CMP）等を通じて、Cookieの使用や広告目的での個人データの収集・共有・利用について選択肢を提示します。表示された同意メッセージから設定を確認または変更できます。</p>'
  )
  .replace(
    '<h2>広告および商品情報</h2><p>当サイトはAmazonアソシエイト等の広告・アフィリエイトサービスを利用します。',
    '<h2>広告および商品情報</h2><p>当サイトはGoogle AdSense、Amazonアソシエイト等の広告・アフィリエイトサービスを利用します。'
  )
  .replace('最終改定日：2026年9月2日', '最終改定日：2026年10月6日');

await writeFile(privacyPath, privacy);

const footerNeedle = '<a href="/aqua-healing/お問い合わせ">お問い合わせ</a><a href="/aqua-healing/プライバシーポリシー">プライバシーポリシー</a>';
const footerReplacement = `${footerNeedle}<a href="/aqua-healing/免責事項">免責事項</a>`;
for (const file of await htmlFiles(docs)) {
  const source = await readFile(file, "utf8");
  if (source.includes(footerNeedle) && !source.includes('href="/aqua-healing/免責事項"')) {
    await writeFile(file, source.replaceAll(footerNeedle, footerReplacement));
  }
}

const disclaimerDir = path.join(docs, "免責事項");
await import("node:fs/promises").then(({ mkdir }) => mkdir(disclaimerDir, { recursive: true }));
const disclaimerUrl = "https://omoikane-ym.github.io/aqua-healing/%E5%85%8D%E8%B2%AC%E4%BA%8B%E9%A0%85/";
const disclaimerSitemapUrl = disclaimerUrl.slice(0, -1);
const disclaimerBody = '<div class="policy-content"><p class="lead">Aqua Healingをご利用いただく前に、以下の内容をご確認ください。</p><h2>掲載情報について</h2><p>当サイトは、実際の飼育経験や公開情報をもとに、できる限り正確で分かりやすい情報の掲載に努めています。ただし、情報の完全性、正確性、安全性、最新性、特定の結果を保証するものではありません。掲載内容は予告なく変更または削除する場合があります。</p><h2>飼育・治療に関する情報</h2><p>生体の状態や適切な飼育方法は、種類、個体差、飼育環境等によって異なります。当サイトの情報は一般的な飼育情報であり、専門家による診断や治療に代わるものではありません。状態が深刻な場合や判断が難しい場合は、観賞魚に詳しい専門店または獣医師へご相談ください。</p><h2>商品・広告について</h2><p>当サイトでは、Google AdSense、Amazonアソシエイト等の広告・アフィリエイトサービスを利用します。商品やサービスの購入・利用に関する最終的な判断は、利用者ご自身の責任で行ってください。価格、在庫、仕様、配送条件等は変更される場合があるため、販売元の最新情報をご確認ください。</p><h2>外部リンクについて</h2><p>当サイトからリンクまたは広告を通じて移動した外部サイトの内容、サービス、個人情報の取扱い等について、当サイトは管理していません。外部サイトの利用条件およびプライバシーポリシーをご確認ください。</p><h2>損害等の責任について</h2><p>当サイトの情報または外部リンクの利用により生じた損害やトラブルについて、法令上免責が認められない場合を除き、当サイトは責任を負いかねます。</p><h2>著作権について</h2><p>当サイトに掲載する文章、写真、生成画像、図表その他のコンテンツの著作権は、当サイトまたは正当な権利者に帰属します。法令で認められる引用の範囲を超えた無断転載、複製、加工、再配布を禁止します。</p><div class="policy-meta"><strong>運営者：Aqua Healing</strong><br/>制定日：2026年10月6日<br/><a class="text-link" href="/aqua-healing/お問い合わせ">お問い合わせ →</a></div></div>';
let disclaimer = privacy
  .replaceAll("プライバシーポリシー", "免責事項")
  .replace(
    '<a href="/aqua-healing/免責事項">免責事項</a><a href="/aqua-healing/免責事項">免責事項</a>',
    '<a href="/aqua-healing/プライバシーポリシー">プライバシーポリシー</a><a href="/aqua-healing/免責事項">免責事項</a>'
  )
  .replace(/<meta name="description" content="[^"]*"\/>/, '<meta name="description" content="Aqua Healingの掲載情報、飼育・治療情報、商品・広告、外部リンク等に関する免責事項です。"/>')
  .replace(/<meta property="og:description" content="[^"]*"\/>/, '<meta property="og:description" content="Aqua Healingをご利用いただく際の免責事項をご案内します。"/>')
  .replace(/<meta name="twitter:description" content="[^"]*"\/>/, '<meta name="twitter:description" content="Aqua Healingをご利用いただく際の免責事項をご案内します。"/>')
  .replace(/https:\/\/omoikane-ym\.github\.io\/aqua-healing\/%E3%83%97%E3%83%A9%E3%82%A4%E3%83%90%E3%82%B7%E3%83%BC%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC\//g, disclaimerUrl)
  .replace(/"description":"Aqua Healingの個人情報、Cookie、アクセス解析、広告配信等の取扱いについてご案内します。"/g, '"description":"Aqua Healingの掲載情報、飼育・治療情報、商品・広告、外部リンク等に関する免責事項です。"')
  .replace(/<div class="policy-content">[\s\S]*?<\/div><\/article>/, `${disclaimerBody}</article>`);
await writeFile(path.join(disclaimerDir, "index.html"), disclaimer);

const sitemapPath = path.join(docs, "sitemap.xml");
let sitemap = await readFile(sitemapPath, "utf8");
if (!sitemap.includes(disclaimerSitemapUrl)) {
  sitemap = sitemap.replace("</urlset>", `<url>\n<loc>${disclaimerSitemapUrl}</loc>\n<changefreq>monthly</changefreq>\n<priority>0.5</priority>\n</url>\n</urlset>`);
  await writeFile(sitemapPath, sitemap);
}

console.log("AdSense policy preparation completed.");
