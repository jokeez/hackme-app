(() => {
  "use strict";

  const Core = window.UsefulPowCore;
  if (!Core) return;

  let projects = [];

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  function originBase() {
    return window.location.href.replace(/docs\.html.*$/, "");
  }

  function badgeHtml(p) {
    const status = p.status || "draft";
    const href = `${originBase()}project.html?id=${encodeURIComponent(p.id)}`;
    const label =
      status === "verified"
        ? "Verified · Useful PoW Index"
        : status === "watchlist"
          ? "Watchlist · Useful PoW Index"
          : "Listed · Useful PoW Index";
    return `<a class="upow-badge upow-${Core.escapeAttr(status)}" href="${Core.escapeAttr(
      href
    )}" target="_blank" rel="noopener noreferrer">${Core.escapeHtml(label)}</a>`;
  }

  function badgeSnippet(p) {
    const href = `${originBase()}project.html?id=${encodeURIComponent(p.id)}`;
    const css = `${originBase()}assets/badge.css`;
    const status = p.status || "draft";
    const label =
      status === "verified"
        ? "Verified · Useful PoW Index"
        : status === "watchlist"
          ? "Watchlist · Useful PoW Index"
          : "Listed · Useful PoW Index";
    return `<!-- Useful PoW Index badge -->
<link rel="stylesheet" href="${css}">
<a class="upow-badge upow-${status}" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }

  function paint() {
    const sel = $("badge-project");
    const p = projects.find((x) => x.id === (sel && sel.value)) || projects[0];
    if (!p) return;
    const preview = $("badge-preview");
    const snip = $("badge-snippet");
    if (preview) preview.innerHTML = badgeHtml(p);
    if (snip) snip.textContent = badgeSnippet(p);
  }

  async function init() {
    const registry = await Core.loadRegistry("./assets/projects.json");
    projects = registry.projects || [];
    const sel = $("badge-project");
    if (sel) {
      sel.innerHTML = projects
        .map(
          (p) =>
            `<option value="${Core.escapeAttr(p.id)}">${Core.escapeHtml(p.name)} (${Core.escapeHtml(
              p.ticker || p.id
            )})</option>`
        )
        .join("");
      sel.addEventListener("change", paint);
    }
    paint();

    const copyBtn = $("btn-copy-badge");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const snip = $("badge-snippet");
        try {
          await navigator.clipboard.writeText((snip && snip.textContent) || "");
          copyBtn.textContent = t("submit.copied");
          setTimeout(() => {
            copyBtn.textContent = t("docs.copySnippet");
          }, 1400);
        } catch (_) {
          copyBtn.textContent = t("submit.copyFail");
        }
      });
    }

    window.addEventListener("usefulpow:langchange", () => {
      if (copyBtn) copyBtn.textContent = t("submit.copy");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
