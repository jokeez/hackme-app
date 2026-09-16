(() => {
  "use strict";

  const Core = window.UsefulPowCore;
  const UI = window.UsefulPowUI;
  if (!Core || !UI) return;

  let registry = { projects: [], schema_version: 1 };
  let project = null;
  let stats = null;

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get("id") || "").trim();
  }

  function renderNotFound() {
    if (window.UsefulPowI18n) window.UsefulPowI18n.updateDocumentTitle();
    document.title = t("title.notFound");
    const main = $("project-main");
    if (main) {
      main.innerHTML = `
        <section class="hero">
          <p class="hero-eyebrow notranslate" translate="no">404</p>
          <h1>${Core.escapeHtml(t("project.notFound"))}</h1>
          <p>${Core.escapeHtml(t("project.notFoundBody"))}</p>
          <div class="btn-row" style="margin-top:1rem">
            <a class="btn btn-primary" href="index.html">${Core.escapeHtml(t("footer.backIndex"))}</a>
          </div>
        </section>
      `;
    }
  }

  function renderCriteriaChecklist(p) {
    const checks = p.review_checklist || {
      useful_work: !!p.useful_work,
      public_metrics: !!(p.api && p.api.type),
      miner_path: !!(p.docs || p.pool),
      honest_scope: !!p.summary,
    };

    const items = [
      [t("check.usefulWork"), checks.useful_work],
      [t("check.publicMetrics"), checks.public_metrics],
      [t("check.minerPath"), checks.miner_path],
      [t("check.honestScope"), checks.honest_scope],
    ];

    return items
      .map(
        ([label, ok]) =>
          `<li class="check-item ${ok ? "ok" : "pending"}">${Core.escapeHtml(label)}</li>`
      )
      .join("");
  }

  function renderLanes(p) {
    const lanes = p.lanes || [];
    if (!lanes.length) return "";
    return `
      <section class="detail-block card mb-4">
        <div class="card-header"><h3 class="card-title"><i class="bi bi-diagram-3 text-primary"></i> ${Core.escapeHtml(t("detail.networkLanes"))}</h3></div>
        <div class="card-body">
        <div class="lane-grid">
          ${lanes
            .map(
              (lane) => `
            <article class="lane-card">
              <span class="lane-tag notranslate" translate="no">${Core.escapeHtml(lane.tag || "lane")}</span>
              <h3 class="notranslate" translate="no">${Core.escapeHtml(lane.name)}</h3>
              <p class="notranslate" translate="no">${Core.escapeHtml(lane.description || "")}</p>
              ${lane.link ? `<a class="lane-link" href="${Core.escapeAttr(lane.link)}" target="_blank" rel="noreferrer">${Core.escapeHtml(t("detail.openLane"))}</a>` : ""}
            </article>
          `
            )
            .join("")}
        </div>
        </div>
      </section>
    `;
  }

  function renderEconomics(p) {
    const econ = p.economics || [];
    if (!econ.length) return "";
    return `
      <section class="detail-block card mb-4">
        <div class="card-header"><h3 class="card-title"><i class="bi bi-cash-stack text-warning"></i> ${Core.escapeHtml(t("detail.economics"))}</h3></div>
        <div class="table-wrap flush">
          <table class="data-table table table-hover">
            <thead><tr><th>${Core.escapeHtml(t("table.metric"))}</th><th>${Core.escapeHtml(t("table.value"))}</th><th>${Core.escapeHtml(t("table.notes"))}</th></tr></thead>
            <tbody>
              ${econ
                .map(
                  (row) => `
                <tr>
                  <td class="notranslate" translate="no">${Core.escapeHtml(row.metric)}</td>
                  <td class="notranslate" translate="no"><strong>${Core.escapeHtml(row.value)}</strong></td>
                  <td class="muted-inline notranslate" translate="no">${Core.escapeHtml(row.notes || "")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderDetail() {
    document.title = `${project.name} · Useful PoW Index`;
    const main = $("project-main");
    if (!main) return;

    main.innerHTML = `
      ${UI.renderCoinHeader(project, stats)}
      ${UI.renderCoinStatRow(project, stats)}
      <div class="sparkline-row coin-spark mb-3" title="${Core.escapeAttr(t("spark.localHint"))}">
        ${UI.renderSparkline(Core.getHistorySeries(project.id), { width: 220, height: 36 })}
        <span class="sparkline-label">${Core.escapeHtml(t("spark.label"))}</span>
      </div>
      ${UI.renderCoinInfoBar(project, stats)}

      <div class="detail-grid">
        <section class="detail-block panel card">
          <div class="card-header"><h3 class="card-title">${Core.escapeHtml(t("detail.liveMetrics"))}</h3></div>
          <div class="card-body">
            <dl class="detail-dl">
              <dt>${Core.escapeHtml(t("meta.usefulWork"))}</dt><dd class="notranslate" translate="no">${Core.escapeHtml(project.useful_work || "—")}</dd>
              <dt>${Core.escapeHtml(t("detail.coordinator"))}</dt><dd class="notranslate" translate="no">${Core.escapeHtml(project.algorithm || "—")}</dd>
              <dt>${Core.escapeHtml(t("detail.payout"))}</dt><dd class="notranslate" translate="no" id="d-payout">${Core.escapeHtml((stats && stats.total_payout) || "—")}</dd>
            </dl>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-detail"><i class="bi bi-arrow-clockwise"></i> ${Core.escapeHtml(t("common.refreshStats"))}</button>
          </div>
        </section>

        <section class="detail-block panel card">
          <div class="card-header"><h3 class="card-title">${Core.escapeHtml(t("detail.reviewChecklist"))}</h3></div>
          <div class="card-body">
            <ul class="check-list">${renderCriteriaChecklist(project)}</ul>
            <p class="detail-note">${Core.escapeHtml(t("detail.reviewNote"))}</p>
          </div>
        </section>
      </div>

      ${UI.renderPoolTable(project.pools, stats)}

      ${project.listing_hub ? `
      <section class="detail-block panel card cta-panel">
        <div class="card-body">
          <h2>${Core.escapeHtml(t("detail.listingHub"))}</h2>
          <a class="btn btn-primary" href="${Core.escapeAttr(project.listing_hub)}" target="_blank" rel="noreferrer">${Core.escapeHtml(t("detail.openListingHub"))}</a>
        </div>
      </section>` : ""}

      ${renderLanes(project)}
      ${renderEconomics(project)}

      <section class="detail-block card panel">
        <div class="card-body">
          <h2>${Core.escapeHtml(t("detail.tags"))}</h2>
          <div class="tag-row">${UI.renderTags(project.tags)}</div>
        </div>
      </section>
    `;

    const refreshBtn = $("btn-refresh-detail");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => void refreshStats());
    }
    if (UI.wireWatchButtons) UI.wireWatchButtons(main);
  }

  async function refreshStats() {
    stats = await Core.fetchProjectStats(project);
    if (!stats) return;
    Core.pushHistoryPoint(project.id, stats);

    const map = {
      "d-hashrate": stats.hashrate,
      "d-workers": stats.workers != null ? Number(stats.workers).toLocaleString() : stats.workers,
      "d-height": stats.height,
      "d-status": stats.status,
      "d-reward": stats.reward,
      "d-diff": stats.difficulty,
      "d-payout": stats.total_payout,
      "d-updated": Core.fmtAgo(stats.ts),
    };

    Object.entries(map).forEach(([id, val]) => {
      const el = $(id);
      if (!el) return;
      el.textContent = val || "—";
      if (id === "d-status") {
        el.className = `stat-value text-danger ${Core.statusClass(stats.status)}`.trim();
      }
    });
  }

  async function init() {
    const id = getProjectId();
    registry = await Core.loadRegistry("./assets/projects.json");
    project = Core.getProjectById(registry, id);

    if (!project) {
      renderNotFound();
      return;
    }

    renderDetail();
    stats = await Core.fetchProjectStats(project);
    if (stats) Core.pushHistoryPoint(project.id, stats);
    renderDetail();
    if (window.UsefulPowTranslateGuard) {
      window.UsefulPowTranslateGuard.markTree(document.getElementById("project-main"));
    }
    setInterval(() => void refreshStats(), Core.POLL_MS);

    window.addEventListener("usefulpow:langchange", () => {
      if (project) renderDetail();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
