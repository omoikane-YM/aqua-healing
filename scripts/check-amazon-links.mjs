import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const REPORT_DIR = resolve(ROOT, "reports");
const REPORT_JSON = resolve(REPORT_DIR, "amazon-link-check.json");
const REPORT_MD = resolve(REPORT_DIR, "amazon-link-check.md");
const STATE_FILE = resolve(REPORT_DIR, "amazon-link-state.json");
const ISSUE_BODY = resolve(REPORT_DIR, "amazon-link-issue.md");
const SOURCES = ["affiliate-products.json", "site-facts.json"];
const TIMEOUT_MS = Number(process.env.AMAZON_LINK_TIMEOUT_MS || 15000);
const REQUEST_INTERVAL_MS = Number(process.env.AMAZON_LINK_INTERVAL_MS || 1000);
const MAX_REDIRECTS = 10;
const UNKNOWN_ISSUE_THRESHOLD = 3;
const USER_AGENT = "Mozilla/5.0 (compatible; aqua-healing-link-monitor/1.0; +https://github.com/omoikane-YM/aqua-healing)";
const AMAZON_HOSTS = new Set([
  "amazon.com", "amazon.ca", "amazon.com.mx", "amazon.com.br",
  "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.it", "amazon.es",
  "amazon.nl", "amazon.se", "amazon.pl", "amazon.com.be", "amazon.com.tr",
  "amazon.co.jp", "amazon.in", "amazon.com.au", "amazon.sg",
  "amazon.ae", "amazon.sa", "amazon.eg"
]);

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const isAmazonHost = (hostname) => {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  return normalized === "link.amazon" || normalized === "amzn.to" || AMAZON_HOSTS.has(normalized);
};

function collectProducts(data, source) {
  if (!Array.isArray(data?.products)) return [];
  return data.products.map((product, index) => ({
    id: String(product.id ?? `${source}-${index + 1}`),
    title: String(product.title ?? product.name ?? product.id ?? `${source} #${index + 1}`),
    url: product.amazon_url ?? product.amazonUrl ?? "",
    source
  }));
}

async function loadTargets() {
  const targets = [];
  for (const source of SOURCES) {
    try {
      const data = JSON.parse(await readFile(resolve(ROOT, source), "utf8"));
      targets.push(...collectProducts(data, source));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const unique = new Map();
  for (const target of targets) unique.set(`${target.id}\0${target.url}`, target);
  return [...unique.values()];
}

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkTarget(target) {
  if (typeof target.url !== "string" || target.url.trim() === "") {
    return { ...target, status: "BROKEN", httpStatus: null, finalUrl: null, redirects: [], reason: "Amazon URL is empty." };
  }

  let current;
  try {
    current = new URL(target.url);
  } catch {
    return { ...target, status: "BROKEN", httpStatus: null, finalUrl: null, redirects: [], reason: "Invalid URL format." };
  }
  if (!/^https?:$/.test(current.protocol) || !isAmazonHost(current.hostname)) {
    return { ...target, status: "BROKEN", httpStatus: null, finalUrl: current.href, redirects: [], reason: "Initial URL is not an allowed Amazon domain." };
  }

  const redirects = [];
  const visited = new Set();
  try {
    for (let count = 0; count <= MAX_REDIRECTS; count += 1) {
      if (visited.has(current.href)) {
        return { ...target, status: "BROKEN", httpStatus: null, finalUrl: current.href, redirects, reason: "Redirect loop detected." };
      }
      visited.add(current.href);

      // Short-link services can return a misleading 404 to HEAD. GET is used only
      // to receive status/redirect headers; the response body is immediately cancelled.
      const response = await request(current, "GET");
      const statusCode = response.status;
      await response.body?.cancel();

      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        const location = response.headers.get("location");
        if (!location) return { ...target, status: "WARNING", httpStatus: statusCode, finalUrl: current.href, redirects, reason: "Redirect response has no Location header." };
        const next = new URL(location, current);
        redirects.push({ status: statusCode, from: current.href, to: next.href });
        current = next;
        continue;
      }

      if (!isAmazonHost(current.hostname)) {
        return { ...target, status: "BROKEN", httpStatus: statusCode, finalUrl: current.href, redirects, reason: "Final URL is outside an Amazon domain." };
      }
      if (statusCode === 403 || statusCode === 429) {
        return { ...target, status: "UNKNOWN", httpStatus: statusCode, finalUrl: current.href, redirects, reason: `Amazon access restriction (HTTP ${statusCode}).` };
      }
      if (statusCode === 404 || statusCode === 410) {
        return { ...target, status: "BROKEN", httpStatus: statusCode, finalUrl: current.href, redirects, reason: `Definitive HTTP ${statusCode}.` };
      }
      if (statusCode >= 200 && statusCode < 400) {
        return { ...target, status: "OK", httpStatus: statusCode, finalUrl: current.href, redirects, reason: "Reached an Amazon domain." };
      }
      return { ...target, status: "WARNING", httpStatus: statusCode, finalUrl: current.href, redirects, reason: `Unexpected HTTP ${statusCode}; manual review recommended.` };
    }
    return { ...target, status: "BROKEN", httpStatus: null, finalUrl: current.href, redirects, reason: `Exceeded ${MAX_REDIRECTS} redirects.` };
  } catch (error) {
    const causeCode = error?.cause?.code || error?.code || "";
    if (error.name === "AbortError" || causeCode === "UND_ERR_ABORTED") {
      return { ...target, status: "UNKNOWN", httpStatus: null, finalUrl: current.href, redirects, reason: `Timed out after ${TIMEOUT_MS} ms.` };
    }
    if (["ENOTFOUND", "EAI_AGAIN", "ENETUNREACH"].includes(causeCode)) {
      return { ...target, status: "BROKEN", httpStatus: null, finalUrl: current.href, redirects, reason: `DNS/network resolution error: ${causeCode}.` };
    }
    return { ...target, status: "UNKNOWN", httpStatus: null, finalUrl: current.href, redirects, reason: `Network result is inconclusive: ${causeCode || error.message}.` };
  }
}

async function loadState() {
  try { return JSON.parse(await readFile(STATE_FILE, "utf8")); } catch { return { links: {} }; }
}

const targets = await loadTargets();
const previousState = await loadState();
const results = [];
for (const [index, target] of targets.entries()) {
  if (index > 0) await sleep(REQUEST_INTERVAL_MS);
  results.push(await checkTarget(target));
}

const now = new Date().toISOString();
const state = { checkedAt: now, links: {} };
for (const result of results) {
  const prior = previousState.links?.[result.id];
  state.links[result.id] = {
    status: result.status,
    consecutiveUnknown: result.status === "UNKNOWN" ? (prior?.consecutiveUnknown || 0) + 1 : 0
  };
  result.consecutiveUnknown = state.links[result.id].consecutiveUnknown;
}

const counts = Object.fromEntries(["OK", "WARNING", "BROKEN", "UNKNOWN"].map((status) => [status, results.filter((result) => result.status === status).length]));
const report = { checkedAt: now, configuration: { sources: SOURCES, timeoutMs: TIMEOUT_MS, requestIntervalMs: REQUEST_INTERVAL_MS, maxRedirects: MAX_REDIRECTS, unknownIssueThreshold: UNKNOWN_ISSUE_THRESHOLD }, counts, results };
const sections = ["# Amazon Link Check", "", `実行日時: ${now}`, `チェック対象: ${results.length}`, "", ...Object.entries(counts).map(([status, count]) => `- ${status}: ${count}`)];
for (const status of ["BROKEN", "UNKNOWN", "WARNING", "OK"]) {
  const entries = results.filter((result) => result.status === status);
  if (!entries.length) continue;
  sections.push("", `## ${status}`, "");
  for (const entry of entries) sections.push(`- ${entry.title} — ${entry.url} — HTTP ${entry.httpStatus ?? "N/A"} — ${entry.reason}${entry.consecutiveUnknown ? ` — UNKNOWN連続 ${entry.consecutiveUnknown}回` : ""}`);
}

const issueCandidates = results.filter((result) => result.status === "BROKEN" || result.consecutiveUnknown >= UNKNOWN_ISSUE_THRESHOLD);
const issueLines = ["# Amazonリンク監視で確認が必要な項目", "", `検出日時: ${now}`, ""];
for (const item of issueCandidates) issueLines.push(`- ${item.title}\n  - URL: ${item.url}\n  - 判定: ${item.status}\n  - HTTP: ${item.httpStatus ?? "N/A"}\n  - 詳細: ${item.reason}`);

await mkdir(REPORT_DIR, { recursive: true });
await Promise.all([
  writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`),
  writeFile(REPORT_MD, `${sections.join("\n")}\n`),
  writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`),
  writeFile(ISSUE_BODY, `${issueLines.join("\n")}\n`)
]);

if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, `broken_count=${counts.BROKEN}\nissue_required=${issueCandidates.length > 0}\n`, { flag: "a" });
}
console.log(JSON.stringify({ total: results.length, ...counts, issueRequired: issueCandidates.length > 0 }));
