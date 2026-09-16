(() => {
  "use strict";

  /** Protect live stats, tickers, and code from Google Translate DOM rewrites. */
  const LIVE_SELECTORS = [
    "[data-live]",
    ".stat-value",
    ".stat-label",
    ".stat-sub",
    ".ticker-stat",
    ".ticker-stat strong",
    ".ticker-updated",
    ".ticker-live",
    ".coin-logo-lg",
    ".coin-logo-placeholder",
    ".coin-cell-link",
    ".coin-header-title",
    ".coin-header-meta",
    ".badge-symbol",
    ".badge-price",
    ".project-ticker",
    ".pool-mini-hash",
    ".output-box",
    ".data-table td",
    ".data-table th",
    ".breakdown-value",
    ".info-bar-item strong",
    "code",
    "pre",
    "kbd",
    "time",
  ].join(",");

  const STYLE_ID = "translate-guard-styles";

  function markNoTranslate(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.classList.contains("allow-translate")) return;
    el.classList.add("notranslate");
    el.setAttribute("translate", "no");
  }

  function markTree(root) {
    if (!root || root.nodeType !== 1) return;
    root.querySelectorAll(LIVE_SELECTORS).forEach(markNoTranslate);
    if (root.matches && root.matches(LIVE_SELECTORS)) markNoTranslate(root);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.notranslate-root { translate: no; }
      body { top: 0 !important; position: static !important; }
      .skiptranslate,
      .goog-te-banner-frame,
      #goog-gt-tt,
      .goog-te-balloon-frame { display: none !important; }
      .goog-te-spinner-pos { display: none !important; }
      iframe.skiptranslate { display: none !important; visibility: hidden !important; }
      .notranslate font,
      font.notranslate { background: inherit !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);
  }

  function protectRoot() {
    document.documentElement.classList.add("notranslate", "notranslate-root");
    document.documentElement.setAttribute("translate", "no");
    if (document.body) {
      document.body.classList.add("notranslate");
      document.body.setAttribute("translate", "no");
    }
  }

  function observe() {
    if (!document.body) return;
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) markTree(node);
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    injectStyles();
    protectRoot();
    markTree(document.documentElement);
    observe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.UsefulPowTranslateGuard = { markTree, markNoTranslate };
})();
