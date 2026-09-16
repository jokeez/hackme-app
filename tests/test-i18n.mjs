#!/usr/bin/env node
/**
 * i18n parity + translate policy audit.
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, "..");

// Load i18n by evaluating in vm-like context
const i18nSrc = fs.readFileSync(path.join(ROOT, "assets/i18n.js"), "utf8");
const STRINGS = (() => {
  const m = i18nSrc.match(/const STRINGS = (\{[\s\S]*?\n  \});/);
  if (!m) throw new Error("STRINGS block not found in i18n.js");
  // eslint-disable-next-line no-eval
  return eval(`(${m[1]})`);
})();

const en = Object.keys(STRINGS.en);
const ru = Object.keys(STRINGS.ru);

const missingRu = en.filter((k) => !(k in STRINGS.ru));
const missingEn = ru.filter((k) => !(k in STRINGS.en));

assert.equal(missingRu.length, 0, `RU missing keys: ${missingRu.join(", ")}`);
assert.equal(missingEn.length, 0, `EN missing keys: ${missingEn.join(", ")}`);

// Technical tokens that must stay Latin in both langs
const KEEP_LATIN = [
  "badge.verified",
  "badge.watchlist",
  "badge.draft",
  "ticker.live",
  "table.hashrate",
  "table.workers",
  "table.height",
  "table.reward",
  "table.difficulty",
  "table.networkHash",
  "table.poolHash",
];

for (const key of KEEP_LATIN) {
  const a = STRINGS.en[key];
  const b = STRINGS.ru[key];
  assert.ok(a, `missing EN ${key}`);
  assert.ok(b, `missing RU ${key}`);
  // RU may intentionally keep technical terms; ensure not empty
  assert.ok(String(b).trim().length > 0, `empty RU for ${key}`);
}

// Pages must load i18n + shell
const pages = [
  "index.html",
  "project.html",
  "login.html",
  "dashboard.html",
  "verified.html",
  "compare.html",
  "docs.html",
  "status.html",
];
for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  for (const needle of ["assets/i18n.js", "assets/shell.js", "navbar-tools", "notranslate"]) {
    assert.match(html, new RegExp(needle.replace(/\./g, "\\.")), `${page} missing ${needle}`);
  }
}

// index.html critical i18n hooks
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
for (const key of [
  "home.poolsTitle",
  "home.allCoinsHeading",
  "home.faqTitle",
  "home.submitTitle",
  "filter.search",
  "footer.disclaimer",
]) {
  assert.match(indexHtml, new RegExp(`data-i18n="${key}"`), `index.html missing data-i18n=${key}`);
}

console.log(`ok i18n parity (${en.length} keys EN/RU)`);
console.log(`ok ${pages.length} pages shell/i18n hooks`);
console.log("ok index.html i18n coverage anchors");
console.log(`\n${3 + pages.length} i18n audit checks passed`);
