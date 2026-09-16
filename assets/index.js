(() => {
  "use strict";

  const Core = window.UsefulPowCore;
  const UI = window.UsefulPowUI;
  if (!Core || !UI) return;

  let registry = { projects: [], schema_version: 1 };
  const liveStats = new Map();
  let pollTimer = null;
  let typesPopulated = false;

  const state = {
    query: "",
    status: "all",
    type: "all",
    tag: "all",
    sort: "hashrate",
  };

  function $(id) {
    return document.getElementById(id);
  }

  function countLivePools(projects) {
    let n = 0;
    (projects || []).forEach((p) => {
      (p.pools || []).forEach((pool) => {
        if (pool.live !== false) n += 1;
      });
    });
    return n;
  }

  function getFilteredProjects() {
    const filtered = Core.filterProjects(registry.projects || [], state);
    return Core.sortProjects(filtered, state.sort, liveStats);
  }

  function countVerified() {
    return (registry.projects || []).filter((p) => p.status === "verified").length;
  }

  function t(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  function paintTicker({ listed, live, aggregateGh, degraded, ts }) {
    const listedEl = $("ticker-listed");
    const liveEl = $("ticker-live-count");
    const hashEl = $("ticker-hash");
    const updatedEl = $("ticker-updated");

    if (listedEl) listedEl.textContent = String(listed);
    if (liveEl) liveEl.textContent = String(live);

    if (hashEl) {
      if (aggregateGh > 0) {
        hashEl.textContent =
          aggregateGh >= 1000
            ? `${(aggregateGh / 1000).toFixed(2)} TH/s`
            : `${aggregateGh.toFixed(1)} GH/s`;
      } else {
        hashEl.textContent = "—";
      }
    }

    if (updatedEl) {
      const ago = Core.fmtAgo(ts || Date.now());
      updatedEl.textContent = degraded
        ? t("ticker.partial", { ago })
        : t("ticker.updated", { ago });
      updatedEl.classList.toggle("degraded", !!degraded);
    }
  }

  function paintKpis(aggregate) {
    const el = $("kpi-grid");
    if (!el) return;
    el.innerHTML = UI.renderKpiCards({
      listed: (registry.projects || []).length,
      verified: countVerified(),
      livePools: countLivePools(registry.projects),
      liveAdapters: aggregate.okCount,
      aggregateGh: aggregate.totalHashrateGH,
      totalWorkers: aggregate.totalWorkers,
    });
  }

  function renderProjects() {
    const grid = $("project-grid");
    const empty = $("listings-empty");
    if (!grid) return;

    const projects = getFilteredProjects();
    if (projects.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
      return;
    }
    if (empty) empty.classList.add("hidden");

    grid.innerHTML = projects
      .map((p) => UI.renderProjectCard(p, liveStats.get(p.id)))
      .join("");
    if (UI.wireWatchButtons) UI.wireWatchButtons(grid);
  }

  function renderTable() {
    const tbody = $("stats-table-body");
    if (!tbody) return;

    const projects = getFilteredProjects();
    if (projects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">${t("empty.noTableMatch")}</td></tr>`;
      return;
    }

    tbody.innerHTML = projects
      .map((p) => UI.renderTableRow(p, liveStats.get(p.id)))
      .join("");
  }

  function renderFilterMeta() {
    const el = $("filter-result-count");
    if (!el) return;
    const total = (registry.projects || []).length;
    const shown = getFilteredProjects().length;
    el.textContent =
      shown === total ? t("filter.projects", { n: total }) : t("filter.shown", { shown, total });
  }

  function wireFilters() {
    const search = $("filter-search");
    const status = $("filter-status");
    const type = $("filter-type");
    const sort = $("filter-sort");

    const refreshListings = () => {
      renderProjects();
      renderTable();
      renderFilterMeta();
    };

    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value;
        refreshListings();
      });
    }

    if (status) {
      status.addEventListener("change", () => {
        state.status = status.value;
        refreshListings();
      });
    }

    if (type) {
      type.addEventListener("change", () => {
        state.type = type.value;
        refreshListings();
      });
    }

    if (sort) {
      sort.addEventListener("change", () => {
        state.sort = sort.value;
        refreshListings();
      });
    }

    document.querySelectorAll("[data-filter-tag]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const tag = chip.getAttribute("data-filter-tag") || "all";
        state.tag = state.tag === tag ? "all" : tag;
        document.querySelectorAll("[data-filter-tag]").forEach((c) => {
          c.classList.toggle("active", c.getAttribute("data-filter-tag") === state.tag);
        });
        refreshListings();
      });
    });
  }

  function populateTypeFilter() {
    const type = $("filter-type");
    if (!type || typesPopulated) return;
    const types = Core.collectTypes(registry.projects || []);
    types.forEach((typeName) => {
      const opt = document.createElement("option");
      opt.value = typeName;
      opt.textContent = typeName;
      type.appendChild(opt);
    });
    typesPopulated = true;
  }

  function renderTagChips() {
    const row = $("tag-chips");
    if (!row) return;
    const tags = Core.collectTags(registry.projects || []);
    row.innerHTML = tags
      .map(
        (t) =>
          `<button type="button" class="chip" data-filter-tag="${Core.escapeAttr(t)}">${Core.escapeHtml(t)}</button>`
      )
      .join("");
  }

  async function refreshAllStats(manual) {
    const btn = $("btn-refresh");
    if (btn) btn.disabled = true;

    const projects = registry.projects || [];
    const results = await Promise.all(
      projects.map(async (p) => {
        const stats = await Core.fetchProjectStats(p);
        if (stats) {
          liveStats.set(p.id, stats);
          Core.pushHistoryPoint(p.id, stats);
        }
        return stats;
      })
    );

    const aggregate = Core.aggregateStats(results);
    const ts = Date.now();
    const degraded = aggregate.okCount < projects.filter((p) => p.api && p.api.type).length;

    paintTicker({
      listed: projects.length,
      live: aggregate.okCount,
      aggregateGh: aggregate.totalHashrateGH,
      degraded,
      ts,
    });
    paintKpis(aggregate);
    window.dispatchEvent(new CustomEvent("usefulpow:statspaint", { detail: { root: $("kpi-grid") } }));

    const stage = $("ticker-stage");
    if (stage) {
      const slides = projects
        .map((p) => {
          const s = liveStats.get(p.id);
          if (!s) return "";
          return `<div class="dt-slide hidden"><strong class="notranslate" translate="no">${Core.escapeHtml(p.name)}</strong> · ${Core.escapeHtml(s.hashrate || "—")} · ${Core.escapeHtml(String(s.workers || "—"))} ${t("table.workers").toLowerCase()}</div>`;
        })
        .filter(Boolean)
        .join("");
      stage.innerHTML =
        slides ||
        `<div class="dt-slide">${t("ticker.fetching")}</div>`;
    }

    const net = $("hero-network");
    if (net) net.textContent = degraded ? t("ticker.partial", { ago: Core.fmtAgo(ts) }) : t("home.networkLive");
    const hashChip = $("hero-hash");
    if (hashChip) {
      hashChip.textContent =
        aggregate.totalHashrateGH >= 1000
          ? `${(aggregate.totalHashrateGH / 1000).toFixed(2)} TH/s`
          : aggregate.totalHashrateGH > 0
            ? `${aggregate.totalHashrateGH.toFixed(1)} GH/s`
            : "—";
    }

    Core.writeCache({
      stats: Object.fromEntries(liveStats),
      listed: projects.length,
      live: aggregate.okCount,
    });

    renderProjects();
    renderTable();
    renderFilterMeta();

    if (window.UsefulPowTranslateGuard) {
      window.UsefulPowTranslateGuard.markTree(document.body);
    }

    if (btn) {
      btn.disabled = false;
      if (manual) {
        const refreshLabel = $("btn-refresh-label");
        const target = refreshLabel || btn;
        target.textContent = t("ticker.refreshed");
        setTimeout(() => {
          target.textContent = t("ticker.refresh");
        }, 1200);
      }
    }
  }

  function hydrateFromCache() {
    const cache = Core.readCache();
    if (!cache || !cache.stats) return;
    Object.entries(cache.stats).forEach(([id, stats]) => liveStats.set(id, stats));
    paintTicker({
      listed: cache.listed || 0,
      live: cache.live || 0,
      aggregateGh: 0,
      degraded: true,
      ts: cache.ts,
    });
  }

  function buildSubmissionPayload() {
    const form = $("submit-form");
    if (!form) return null;
    const fd = new FormData(form);
    return {
      schema_version: 1,
      submitted_at: new Date().toISOString(),
      project: {
        name: String(fd.get("name") || "").trim(),
        ticker: String(fd.get("ticker") || "").trim().toUpperCase(),
        useful_work: String(fd.get("useful_work") || "").trim(),
        useful_type: String(fd.get("useful_type") || "").trim(),
        algorithm: String(fd.get("algorithm") || "").trim(),
        site: String(fd.get("site") || "").trim(),
        docs: String(fd.get("docs") || "").trim(),
        pool: String(fd.get("pool") || "").trim(),
        metrics_api: String(fd.get("metrics_api") || "").trim(),
        github: String(fd.get("github") || "").trim(),
        summary: String(fd.get("summary") || "").trim(),
      },
    };
  }

  function wireSubmitForm() {
    const form = $("submit-form");
    const output = $("submit-output");
    const copyBtn = $("btn-copy-json");
    const downloadBtn = $("btn-download-json");
    if (!form || !output) return;

    function refreshOutput() {
      output.textContent = JSON.stringify(buildSubmissionPayload(), null, 2);
    }

    form.addEventListener("input", refreshOutput);
    refreshOutput();

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(output.textContent || "");
          const payload = buildSubmissionPayload();
          if (window.UsefulPowAuth && payload) {
            window.UsefulPowAuth.saveSubmission(payload);
          }
          copyBtn.textContent = t("submit.copied");
          setTimeout(() => {
            copyBtn.textContent = t("submit.copy");
          }, 1600);
        } catch (_) {
          copyBtn.textContent = t("submit.copyFail");
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(buildSubmissionPayload(), null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `useful-pow-submission-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (window.UsefulPowAuth) {
          window.UsefulPowAuth.saveSubmission(buildSubmissionPayload());
        }
      });
    }
  }

  function wireNav() {
    const refreshBtn = $("btn-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => void refreshAllStats(true));
    }
  }

  async function init() {
    wireNav();
    wireSubmitForm();
    hydrateFromCache();
    registry = await Core.loadRegistry("./assets/projects.json");
    populateTypeFilter();
    renderTagChips();
    wireFilters();
    renderProjects();
    renderTable();
    renderFilterMeta();
    await refreshAllStats(false);
    pollTimer = setInterval(() => void refreshAllStats(false), Core.POLL_MS);

    window.addEventListener("usefulpow:langchange", () => {
      renderProjects();
      renderTable();
      renderFilterMeta();
      const agg = Core.aggregateStats([...liveStats.values()]);
      paintKpis(agg);
      const projects = registry.projects || [];
      const degraded = agg.okCount < projects.filter((p) => p.api && p.api.type).length;
      paintTicker({
        listed: projects.length,
        live: agg.okCount,
        aggregateGh: agg.totalHashrateGH,
        degraded,
        ts: Date.now(),
      });
      const net = $("hero-network");
      if (net) {
        net.textContent = degraded ? t("ticker.partial", { ago: Core.fmtAgo(Date.now()) }) : t("home.networkLive");
      }
    });

    window.addEventListener("usefulpow:watchchange", () => {
      renderProjects();
    });
  }

  window.addEventListener("beforeunload", () => {
    if (pollTimer) clearInterval(pollTimer);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
