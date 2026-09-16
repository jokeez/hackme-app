#!/usr/bin/env node
/**
 * English-only i18n + translate policy audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const i18nSrc = fs.readFileSync(path.join(ROOT, "assets/i18n.js"), "utf8");
const STRINGS = (() => {
  const m = i18nSrc.match(/const STRINGS = (\{[\s\S]*?\n  \});/);
  if (!m) throw new Error("STRINGS block not found in i18n.js");
  // eslint-disable-next-line no-eval
  return eval(`(${m[1]})`);
})();

assert.ok(STRINGS.en, "STRINGS.en missing");
assert.equal(STRINGS.ru, undefined, "STRINGS.ru must be removed (English-only)");

const en = Object.keys(STRINGS.en);
assert.ok(en.length > 50, `expected a full EN catalog, got ${en.length} keys`);

const cyrillic = /[\u0400-\u04FF]/;
for (const key of en) {
  assert.ok(!cyrillic.test(STRINGS.en[key]), `Cyrillic in EN key ${key}`);
}

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
  assert.ok(a, `missing EN ${key}`);
  assert.ok(String(a).trim().length > 0, `empty EN for ${key}`);
}

const shell = fs.readFileSync(path.join(ROOT, "assets/shell.js"), "utf8");
assert.doesNotMatch(shell, /renderLangSwitch|lang-switch|lang-btn/, "shell must not render lang switcher");
const css = fs.readFileSync(path.join(ROOT, "assets/styles.css"), "utf8");
assert.doesNotMatch(css, /\.lang-switch|\.lang-btn/, "styles must not define lang switcher");

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
  assert.match(html, /html lang="en"/, `${page} must be lang=en`);
  assert.doesNotMatch(html, /lang-switch|data-lang=/, `${page} must not expose lang switcher`);
}

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

const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
assert.match(readme, /<pre aria-label="HackMe App ASCII logo">/, "README must use HackMe-style <pre> ASCII logo");
assert.match(readme, /Useful PoW Index/, "README must name Useful PoW Index");
assert.match(readme, /free/i, "README must mention free listing vision");
assert.match(readme, /HackMe App · Useful PoW Index/, "README title must be HackMe App");

console.log(`ok English-only i18n (${en.length} keys)`);
console.log(`ok ${pages.length} pages shell/i18n hooks`);
console.log("ok index.html i18n coverage anchors");
console.log("ok lang switcher removed");
console.log("ok README HackMe-style ASCII logo");
console.log(`\n${5 + pages.length} i18n audit checks passed`);
