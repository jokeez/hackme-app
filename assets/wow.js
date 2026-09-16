(() => {
  "use strict";

  const I18n = window.UsefulPowI18n;
  const t = (key, vars) => (I18n ? I18n.t(key, vars) : key);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PAGES = [
    { href: "index.html", key: "nav.home", group: "nav" },
    { href: "index.html#listings", key: "nav.coins", group: "nav" },
    { href: "index.html#live-stats", key: "nav.pools", group: "nav" },
    { href: "compare.html", key: "nav.compare", group: "nav" },
    { href: "docs.html", key: "nav.docs", group: "nav" },
    { href: "status.html", key: "nav.status", group: "nav" },
    { href: "verified.html", key: "nav.verified", group: "nav" },
    { href: "index.html#submit", key: "sidebar.submit", group: "nav" },
    { href: "dashboard.html", key: "nav.dashboard", group: "nav" },
    { href: "https://hackme.tech/", key: "sidebar.hackmeHub", group: "nav", external: true },
  ];

  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function injectScene() {
    if (document.querySelector(".scene-grid")) return;
    document.body.prepend(el("div", "scene-grid"));
    const glow = el("div", "pointer-glow");
    document.body.prepend(glow);
    if (reduceMotion) return;
    window.addEventListener(
      "pointermove",
      (ev) => {
        document.body.classList.add("pointer-on");
        glow.style.left = `${ev.clientX}px`;
        glow.style.top = `${ev.clientY}px`;
      },
      { passive: true }
    );
  }

  function isMac() {
    return /Mac|iPhone|iPad/.test(navigator.platform || "");
  }

  function cmdHint() {
    return isMac() ? "⌘K" : "Ctrl K";
  }

  function mountCmdButton() {
    const tools = document.getElementById("navbar-tools");
    if (!tools || tools.querySelector(".btn-cmd")) return;
    const btn = el("button", "btn-cmd");
    btn.type = "button";
    btn.id = "btn-command";
    btn.innerHTML = `<i class="bi bi-search"></i><span data-i18n="cmd.search">Search</span><kbd>${cmdHint()}</kbd>`;
    btn.addEventListener("click", () => openPalette());
    tools.insertBefore(btn, tools.firstChild);
    if (I18n) I18n.apply(btn);
  }

  let paletteOpen = false;
  let projectsCache = [];
  let activeIndex = 0;

  async function loadProjects() {
    if (projectsCache.length) return projectsCache;
    try {
      const res = await fetch("./assets/projects.json", { cache: "no-store" });
      const data = await res.json();
      projectsCache = data.projects || [];
    } catch (_) {
      projectsCache = [];
    }
    return projectsCache;
  }

  function collectItems(query) {
    const q = (query || "").trim().toLowerCase();
    const navItems = PAGES.map((p) => ({
      href: p.href,
      title: t(p.key),
      hint: p.external ? "hackme.tech" : p.href.replace(".html", ""),
      external: !!p.external,
    }));
    const coinItems = projectsCache.map((p) => ({
      href: `project.html?id=${encodeURIComponent(p.id)}`,
      title: p.name,
      hint: `${p.ticker || ""} · ${p.useful_type || ""}`.trim(),
    }));
    const all = [...navItems, ...coinItems];
    if (!q) return all.slice(0, 12);
    return all.filter((item) => `${item.title} ${item.hint}`.toLowerCase().includes(q)).slice(0, 16);
  }

  function renderList(listEl, items) {
    if (!items.length) {
      listEl.innerHTML = `<p class="cmd-empty" data-i18n="cmd.empty">${t("cmd.empty")}</p>`;
      return;
    }
    const esc = (s) =>
      String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    listEl.innerHTML = items
      .map(
        (item, i) => `
        <button type="button" class="cmd-item${i === activeIndex ? " active" : ""}" data-href="${esc(item.href)}" data-ext="${item.external ? "1" : "0"}">
          <span>${esc(item.title)}</span>
          <small class="notranslate" translate="no">${esc(item.hint)}</small>
        </button>`
      )
      .join("");
    listEl.querySelectorAll(".cmd-item").forEach((btn) => {
      btn.addEventListener("click", () => go(btn.dataset.href, btn.dataset.ext === "1"));
    });
  }

  function go(href, external) {
    closePalette();
    if (!href) return;
    if (external || href.startsWith("http")) {
      window.open(href, "_blank", "noreferrer");
      return;
    }
    window.location.href = href;
  }

  function closePalette() {
    const node = document.getElementById("cmd-backdrop");
    if (node) node.remove();
    paletteOpen = false;
  }

  async function openPalette() {
    if (paletteOpen) return;
    paletteOpen = true;
    await loadProjects();
    activeIndex = 0;
    const backdrop = el("div", "cmd-backdrop");
    backdrop.id = "cmd-backdrop";
    backdrop.innerHTML = `
      <div class="cmd-dialog glass" role="dialog" aria-modal="true" aria-label="${t("cmd.title")}">
        <p class="cmd-kicker">${t("cmd.title")}</p>
        <input class="cmd-input" id="cmd-input" type="search" autocomplete="off" placeholder="${t("cmd.placeholder")}" />
        <div class="cmd-list" id="cmd-list"></div>
      </div>
    `;
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) closePalette();
    });
    document.body.appendChild(backdrop);
    const input = document.getElementById("cmd-input");
    const listEl = document.getElementById("cmd-list");
    const paint = () => {
      const items = collectItems(input.value);
      if (activeIndex >= items.length) activeIndex = 0;
      renderList(listEl, items);
    };
    input.addEventListener("input", () => {
      activeIndex = 0;
      paint();
    });
    input.addEventListener("keydown", (ev) => {
      const items = collectItems(input.value);
      if (ev.key === "Escape") {
        ev.preventDefault();
        closePalette();
      } else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        activeIndex = (activeIndex + 1) % Math.max(items.length, 1);
        paint();
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        activeIndex = (activeIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
        paint();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const item = items[activeIndex];
        if (item) go(item.href, item.external);
      }
    });
    paint();
    input.focus();
  }

  function wireHotkeys() {
    document.addEventListener("keydown", (ev) => {
      const combo = (ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k";
      if (combo) {
        ev.preventDefault();
        if (paletteOpen) closePalette();
        else void openPalette();
      }
      if (ev.key === "Escape" && paletteOpen) closePalette();
    });
  }

  function animateStats(root) {
    if (reduceMotion) return;
    const scope = root || document;
    scope.querySelectorAll("[data-count]").forEach((node) => {
      const raw = node.getAttribute("data-count");
      const target = Number(raw);
      if (!Number.isFinite(target)) return;
      const start = performance.now();
      const dur = 700;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
        else node.textContent = String(target);
      };
      requestAnimationFrame(tick);
    });
  }

  function applyViewMode(mode) {
    const grid = document.getElementById("project-grid");
    if (!grid) return;
    grid.classList.toggle("list-mode", mode === "list");
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === mode);
    });
    try {
      localStorage.setItem("useful-pow.view.v1", mode);
    } catch (_) {
      /* ignore */
    }
  }

  function wireViewToggle() {
    const saved = (() => {
      try {
        return localStorage.getItem("useful-pow.view.v1") || "grid";
      } catch (_) {
        return "grid";
      }
    })();
    applyViewMode(saved);
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => applyViewMode(btn.getAttribute("data-view")));
    });
  }

  function rotateTicker() {
    const stage = document.getElementById("ticker-stage");
    if (!stage) return;
    const slides = () => Array.from(stage.querySelectorAll(".dt-slide"));
    let i = 0;
    const show = () => {
      const items = slides();
      if (!items.length) return;
      items.forEach((s, idx) => s.classList.toggle("hidden", idx !== i % items.length));
      i += 1;
    };
    show();
    if (!reduceMotion) setInterval(show, 4200);
  }

  function init() {
    injectScene();
    mountCmdButton();
    wireHotkeys();
    wireViewToggle();
    rotateTicker();
    window.addEventListener("usefulpow:statspaint", (ev) => {
      animateStats((ev.detail && ev.detail.root) || document.getElementById("kpi-grid"));
    });
    window.addEventListener("usefulpow:langchange", () => {
      mountCmdButton();
    });
    window.addEventListener("usefulpow:authchange", () => {
      setTimeout(mountCmdButton, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.UsefulPowWow = { openPalette, closePalette, animateStats, applyViewMode, mountCmdButton };
})();
