/**
 * Useful PoW Index — shared UI render helpers.
 */
(function () {
  "use strict";

  const Core = window.UsefulPowCore;
  if (!Core) return;

  function liveWrap(innerHtml) {
    return `<span class="notranslate" translate="no" data-live="1">${innerHtml}</span>`;
  }

  function tr(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  function badgeForStatus(status) {
    if (status === "verified") {
      return `<span class="badge badge-verified notranslate" translate="no">${Core.escapeHtml(tr("badge.verified"))}</span>`;
    }
    if (status === "watchlist") {
      return `<span class="badge badge-watchlist notranslate" translate="no">${Core.escapeHtml(tr("badge.watchlist"))}</span>`;
    }
    return `<span class="badge badge-draft notranslate" translate="no">${Core.escapeHtml(tr("badge.draft"))}</span>`;
  }

  function renderProjectLinks(p) {
    const links = [
      p.site && { href: p.site, label: tr("common.site") },
      p.pool && { href: p.pool, label: tr("common.pool") },
      p.docs && { href: p.docs, label: tr("common.docs") },
      p.explorer && { href: p.explorer, label: tr("common.explorer") },
      p.github && { href: p.github, label: tr("common.github") },
      { href: `project.html?id=${encodeURIComponent(p.id)}`, label: tr("common.details") },
    ].filter(Boolean);

    return links
      .map((l) => {
        const ext = l.href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : "";
        return `<a href="${Core.escapeAttr(l.href)}"${ext}>${Core.escapeHtml(l.label)}</a>`;
      })
      .join("");
  }

  function renderTags(tags) {
    return (tags || [])
      .map((tag) => `<span class="tag notranslate" translate="no">${Core.escapeHtml(tag)}</span>`)
      .join("");
  }

  function renderSparkline(series, opts) {
    const points = series || [];
    const w = (opts && opts.width) || 120;
    const h = (opts && opts.height) || 28;
    const key = (opts && opts.key) || "hashrate_gh";
    if (points.length < 2) {
      return `<span class="sparkline sparkline-empty" title="${Core.escapeAttr(tr("spark.needHistory"))}" aria-hidden="true"></span>`;
    }
    const vals = points.map((p) => Number(p[key]) || 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const step = (w - 2) / (vals.length - 1);
    const coords = vals
      .map((v, i) => {
        const x = 1 + i * step;
        const y = h - 2 - ((v - min) / span) * (h - 4);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const last = vals[vals.length - 1];
    const first = vals[0];
    const up = last >= first;
    return `
      <svg class="sparkline ${up ? "spark-up" : "spark-down"}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" role="img">
        <polyline fill="none" stroke-width="1.5" points="${coords}"></polyline>
      </svg>
    `;
  }

  function renderProjectCard(p, stats) {
    const verified = p.status === "verified";
    const cardClass = verified ? "verified" : p.status === "watchlist" ? "watchlist" : "";
    const initials = Core.escapeHtml((p.ticker || p.name || "?").slice(0, 3).toUpperCase());
    const history = Core.getHistorySeries(p.id);
    const spark = renderSparkline(history, { key: "hashrate_gh", width: 110, height: 26 });
    const watched = window.UsefulPowAuth && window.UsefulPowAuth.isWatched(p.id);

    return `
      <article class="project-card ${cardClass}" data-id="${Core.escapeAttr(p.id)}">
        <div class="project-top">
          <div style="display:flex;gap:0.75rem;align-items:flex-start">
            <span class="coin-logo-placeholder sm" aria-hidden="true">${initials}</span>
            <div>
              <h3>${Core.escapeHtml(p.name)}</h3>
              <div class="project-ticker">${Core.escapeHtml(p.ticker || "—")}</div>
            </div>
          </div>
          ${badgeForStatus(p.status)}
        </div>
        <p class="project-summary">${Core.escapeHtml(p.useful_work || p.summary || "")}</p>
        <dl class="project-meta">
          <dt>${Core.escapeHtml(tr("meta.hashrate"))}</dt>
          <dd class="stat-hashrate">${liveWrap(Core.escapeHtml((stats && stats.hashrate) || "—"))}</dd>
          <dt>${Core.escapeHtml(tr("meta.workers"))}</dt>
          <dd class="stat-workers">${liveWrap(Core.escapeHtml((stats && stats.workers) || "—"))}</dd>
        </dl>
        <div class="sparkline-row" title="${Core.escapeAttr(tr("spark.localHint"))}">
          ${spark}
          <span class="sparkline-label">${Core.escapeHtml(tr("spark.label"))}</span>
        </div>
        <div class="card-actions">
          <a class="btn btn-sm btn-primary" href="project.html?id=${encodeURIComponent(p.id)}">${Core.escapeHtml(tr("common.details"))}</a>
          <button type="button" class="btn btn-sm btn-outline-secondary btn-watch" data-watch-id="${Core.escapeAttr(
            p.id
          )}" aria-pressed="${watched ? "true" : "false"}">
            <i class="bi ${watched ? "bi-star-fill" : "bi-star"}"></i>
            <span>${Core.escapeHtml(watched ? tr("watch.remove") : tr("watch.add"))}</span>
          </button>
        </div>
        <div class="tag-row">${renderTags(p.tags)}</div>
      </article>
    `;
  }

  function renderTableRow(p, stats) {
    return `
      <tr data-id="${Core.escapeAttr(p.id)}">
        <td>
          <a class="table-link" href="project.html?id=${encodeURIComponent(p.id)}">
            <strong>${Core.escapeHtml(p.name)}</strong>
          </a>
          <br><span class="muted-inline">${Core.escapeHtml(p.ticker || "")}</span>
        </td>
        <td class="col-hide-sm">${Core.escapeHtml(p.useful_type || "—")}</td>
        <td>${liveWrap(Core.escapeHtml((stats && stats.hashrate) || "—"))}</td>
        <td>${liveWrap(Core.escapeHtml((stats && stats.workers) || "—"))}</td>
        <td>${liveWrap(Core.escapeHtml((stats && stats.height) || "—"))}</td>
        <td class="col-hide-md">${liveWrap(Core.escapeHtml((stats && stats.reward) || "—"))}</td>
        <td class="${Core.statusClass(stats && stats.status)}">${liveWrap(Core.escapeHtml((stats && stats.status) || "—"))}</td>
      </tr>
    `;
  }

  function renderHashrateBreakdown(stats) {
    const poolGh = stats && stats.hashrate_gh ? stats.hashrate_gh : 0;
    const poolLabel = (stats && stats.hashrate) || "—";
    const workers = (stats && stats.workers) || "—";

    return `
      <section class="detail-block card mb-4">
        <div class="card-header"><h3 class="card-title"><i class="bi bi-lightning-charge text-success"></i> ${Core.escapeHtml(tr("detail.hashrateBreakdown"))}</h3></div>
        <div class="card-body">
          <p class="panel-intro">${Core.escapeHtml(tr("detail.breakdownIntro"))}</p>
          <div class="breakdown-grid">
          <div class="breakdown-item">
            <span class="breakdown-label">${Core.escapeHtml(tr("detail.poolCoordinator"))}</span>
            <strong class="breakdown-value notranslate" translate="no">${Core.escapeHtml(poolLabel)}</strong>
            <span class="breakdown-hint notranslate" translate="no">${Core.escapeHtml(tr("detail.workersCount", { n: String(workers) }))}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">${Core.escapeHtml(tr("detail.indexedWork"))}</span>
            <strong class="breakdown-value notranslate" translate="no">${poolGh > 0 ? Core.escapeHtml(`${poolGh.toFixed(1)} GH/s`) : "—"}</strong>
            <span class="breakdown-hint notranslate" translate="no">WASM fuzz + PoH lanes</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">${Core.escapeHtml(tr("detail.soloUnknown"))}</span>
            <strong class="breakdown-value">—</strong>
            <span class="breakdown-hint">${Core.escapeHtml(tr("detail.notTracked"))}</span>
          </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPoolTable(pools, stats) {
    const list = pools || [];
    if (!list.length) return "";

    return `
      <section class="detail-block card mb-4">
        <div class="card-header"><h3 class="card-title"><i class="bi bi-hdd-stack text-info"></i> ${Core.escapeHtml(tr("detail.poolCompare"))}</h3></div>
        <div class="table-wrap flush">
          <table class="data-table table table-hover">
            <thead>
              <tr>
                <th>${Core.escapeHtml(tr("table.pool"))}</th>
                <th>${Core.escapeHtml(tr("table.fee"))}</th>
                <th>${Core.escapeHtml(tr("table.payout"))}</th>
                <th>${Core.escapeHtml(tr("table.coordinator"))}</th>
                <th>${Core.escapeHtml(tr("table.region"))}</th>
                <th>${Core.escapeHtml(tr("table.hashrate"))}</th>
                <th>${Core.escapeHtml(tr("table.workers"))}</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (pool) => `
                <tr>
                  <td>
                    <a class="table-link notranslate" translate="no" href="${Core.escapeAttr(pool.url)}" target="_blank" rel="noreferrer">${Core.escapeHtml(pool.name)}</a>
                    ${pool.notes ? `<br><span class="muted-inline notranslate" translate="no">${Core.escapeHtml(pool.notes)}</span>` : ""}
                  </td>
                  <td class="notranslate" translate="no">${Core.escapeHtml(pool.fee || "—")}</td>
                  <td class="notranslate" translate="no">${Core.escapeHtml(pool.payout || "—")}</td>
                  <td class="notranslate" translate="no">${Core.escapeHtml(pool.coordinator || "—")}</td>
                  <td class="notranslate" translate="no">${Core.escapeHtml(pool.region || "—")}</td>
                  <td class="notranslate" translate="no">${Core.escapeHtml((stats && stats.hashrate) || "—")}</td>
                  <td class="notranslate" translate="no">${Core.escapeHtml((stats && stats.workers) || "—")}</td>
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

  function coinInitials(p) {
    return Core.escapeHtml((p.ticker || p.name || "?").slice(0, 2).toUpperCase());
  }

  function renderCoinCell(p) {
    return `
      <a class="coin-cell-link" href="project.html?id=${encodeURIComponent(p.id)}">
        <span class="coin-logo-placeholder table-logo">${coinInitials(p)}</span>
        <span class="coin-cell-name">${Core.escapeHtml(p.name)}</span>
        <span class="badge badge-symbol">${Core.escapeHtml(p.ticker || "—")}</span>
      </a>
    `;
  }

  function renderTopCoinRow(p, stats, rank) {
    const poolCount = (p.pools || []).length || (p.pool ? 1 : 0);
    return `
      <tr data-id="${Core.escapeAttr(p.id)}">
        <td class="col-rank text-muted">${rank}</td>
        <td>${renderCoinCell(p)}</td>
        <td class="col-hide-sm text-muted">${Core.escapeHtml(p.algorithm || p.useful_type || "N/A")}</td>
        <td class="col-hide-xs">${liveWrap(String(poolCount))}</td>
        <td>${liveWrap(`<strong class="text-success">${Core.escapeHtml((stats && stats.hashrate) || "—")}</strong>`)}</td>
      </tr>
    `;
  }

  function renderWatchlistRow(p, stats, rank) {
    const poolCount = (p.pools || []).length || (p.pool ? 1 : 0);
    return `
      <tr data-id="${Core.escapeAttr(p.id)}">
        <td class="col-rank text-muted">${rank}.</td>
        <td>${renderCoinCell(p)}</td>
        <td class="col-hide-sm text-muted">${Core.escapeHtml(p.useful_type || "N/A")}</td>
        <td class="col-hide-md">${badgeForStatus(p.status)}</td>
        <td class="col-hide-xs">${liveWrap(String(poolCount))}</td>
        <td class="col-end">${liveWrap(`<strong class="text-muted">${Core.escapeHtml((stats && stats.hashrate) || "—")}</strong>`)}</td>
      </tr>
    `;
  }

  function renderPoolMiniCard(pool, project, stats) {
    return `
      <a class="pool-mini-card" href="${Core.escapeAttr(pool.url)}" target="_blank" rel="noreferrer">
        <div class="pool-mini-icon"><i class="bi bi-hdd-stack"></i></div>
        <div class="pool-mini-body">
          <div class="pool-mini-name">${Core.escapeHtml(pool.name)}</div>
          <div class="pool-mini-meta text-muted">${Core.escapeHtml(project.name)} · ${Core.escapeHtml(pool.region || "Global")}</div>
          <div class="pool-mini-hash ${stats && stats.ok ? "text-success" : "text-muted"}">${liveWrap(Core.escapeHtml((stats && stats.hashrate) || "—"))}</div>
        </div>
      </a>
    `;
  }

  function renderCoinHeader(p, stats) {
    const actions = [
      p.site && { href: p.site, label: tr("common.website"), icon: "bi-globe", cls: "btn-outline-primary" },
      p.pool && { href: p.pool, label: tr("common.pool"), icon: "bi-hdd-network", cls: "btn-outline-secondary" },
      p.github && { href: p.github, label: tr("common.github"), icon: "bi-github", cls: "btn-outline-secondary" },
    ].filter(Boolean);

    return `
      <div class="card coin-header-card mb-4">
        <div class="card-body coin-header-body">
          <div class="coin-header-row">
            <span class="coin-logo-lg" aria-hidden="true">${coinInitials(p)}</span>
            <div class="coin-header-main">
              <h2 class="coin-header-title">${Core.escapeHtml(p.name)} (${Core.escapeHtml(p.ticker || "—")})</h2>
              <div class="coin-header-meta">
                <span class="text-muted">${Core.escapeHtml(p.algorithm || p.useful_type || "")}</span>
                ${badgeForStatus(p.status)}
              </div>
              ${p.useful_work ? `<p class="coin-header-summary text-muted">${Core.escapeHtml(p.useful_work)}</p>` : ""}
            </div>
            <div class="coin-header-actions">
              ${actions
                .map(
                  (a) =>
                    `<a href="${Core.escapeAttr(a.href)}" target="_blank" rel="noreferrer" class="btn btn-sm ${a.cls}"><i class="bi ${a.icon}"></i> ${Core.escapeHtml(a.label)}</a>`
                )
                .join("")}
              <button type="button" class="btn btn-sm btn-outline-warning btn-watch" data-watch-id="${Core.escapeAttr(
                p.id
              )}" aria-pressed="${window.UsefulPowAuth && window.UsefulPowAuth.isWatched(p.id) ? "true" : "false"}">
                <i class="bi ${window.UsefulPowAuth && window.UsefulPowAuth.isWatched(p.id) ? "bi-star-fill" : "bi-star"}"></i>
                <span data-watch-label>${Core.escapeHtml(
                  window.UsefulPowAuth && window.UsefulPowAuth.isWatched(p.id) ? tr("watch.remove") : tr("watch.add")
                )}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCoinStatRow(p, stats) {
    const poolLabel = (stats && stats.hashrate) || "—";
    const workers = stats && stats.workers != null ? Number(stats.workers).toLocaleString() : "—";
    const height = (stats && stats.height) || "—";

    return `
      <div class="stat-row coin-stat-row mb-4">
        <article class="stat-card">
          <i class="bi bi-lightning-charge stat-icon text-success"></i>
          <div class="stat-value text-success" id="d-hashrate">${Core.escapeHtml(poolLabel)}</div>
          <div class="stat-label">${Core.escapeHtml(tr("detail.poolHashrate"))}</div>
        </article>
        <article class="stat-card">
          <i class="bi bi-people stat-icon text-info"></i>
          <div class="stat-value text-info" id="d-workers">${Core.escapeHtml(String(workers))}</div>
          <div class="stat-label">${Core.escapeHtml(tr("table.workers"))}</div>
        </article>
        <article class="stat-card">
          <i class="bi bi-box stat-icon text-warning"></i>
          <div class="stat-value text-warning" id="d-height">${Core.escapeHtml(String(height))}</div>
          <div class="stat-label">${Core.escapeHtml(tr("detail.blockHeight"))}</div>
        </article>
        <article class="stat-card">
          <i class="bi bi-activity stat-icon text-danger"></i>
          <div class="stat-value ${Core.statusClass(stats && stats.status)}" id="d-status">${Core.escapeHtml((stats && stats.status) || "—")}</div>
          <div class="stat-label">${Core.escapeHtml(tr("detail.apiStatus"))}</div>
        </article>
      </div>
    `;
  }

  function renderCoinInfoBar(p, stats) {
    return `
      <div class="card coin-info-bar mb-4">
        <div class="card-body coin-info-body">
          <div class="info-bar-item">${Core.escapeHtml(tr("detail.usefulType"))}: <strong class="text-body notranslate" translate="no">${Core.escapeHtml(p.useful_type || "N/A")}</strong></div>
          <div class="info-bar-item">${Core.escapeHtml(tr("detail.algorithm"))}: <strong class="text-body notranslate" translate="no">${Core.escapeHtml(p.algorithm || "N/A")}</strong></div>
          <div class="info-bar-item">${Core.escapeHtml(tr("detail.blockReward"))}: <strong class="text-body notranslate" translate="no" id="d-reward">${Core.escapeHtml((stats && stats.reward) || "—")}</strong></div>
          <div class="info-bar-item">${Core.escapeHtml(tr("detail.difficulty"))}: <strong class="text-body notranslate" translate="no" id="d-diff">${Core.escapeHtml((stats && stats.difficulty) || "—")}</strong></div>
          <div class="info-bar-item">${Core.escapeHtml(tr("detail.verified"))}: <strong class="text-body notranslate" translate="no">${Core.escapeHtml(p.verified_at || tr("detail.pendingReview"))}</strong></div>
          <div class="info-bar-item">${Core.escapeHtml(tr("detail.lastRefresh"))}: <strong class="text-body notranslate" translate="no" id="d-updated">${stats && stats.ts ? Core.escapeHtml(Core.fmtAgo(stats.ts)) : "—"}</strong></div>
        </div>
      </div>
    `;
  }

  function renderKpiCards(summary) {
    const I18n = window.UsefulPowI18n;
    const tr = (k, vars) => (I18n ? I18n.t(k, vars) : k);
    const { listed, verified, livePools, aggregateGh, totalWorkers } = summary;
    const hashLabel =
      aggregateGh >= 1000
        ? `${(aggregateGh / 1000).toFixed(2)} TH/s`
        : aggregateGh > 0
          ? `${aggregateGh.toFixed(1)} GH/s`
          : "—";

    return `
      <article class="stat-card stat-accent-primary glass">
        <span class="stat-icon bi bi-coin" aria-hidden="true"></span>
        <div class="stat-value text-primary" data-count="${Number(listed) || 0}">${Core.escapeHtml(String(listed))}</div>
        <div class="stat-label">${tr("kpi.listedCoins")}</div>
        ${verified ? `<small class="stat-sub">${tr("kpi.verified", { n: verified })}</small>` : ""}
      </article>
      <article class="stat-card stat-accent-success glass">
        <span class="stat-icon bi bi-hdd-stack" aria-hidden="true"></span>
        <div class="stat-value text-success" data-count="${Number(livePools) || 0}">${Core.escapeHtml(String(livePools))}</div>
        <div class="stat-label">${tr("kpi.livePools")}</div>
      </article>
      <article class="stat-card stat-accent-danger glass">
        <span class="stat-icon bi bi-people" aria-hidden="true"></span>
        <div class="stat-value text-danger" data-count="${Number(totalWorkers) || 0}">${Core.escapeHtml(totalWorkers > 0 ? Number(totalWorkers).toLocaleString() : "—")}</div>
        <div class="stat-label">${tr("kpi.workers")}</div>
      </article>
      <article class="stat-card stat-accent-info glass">
        <span class="stat-icon bi bi-lightning-charge" aria-hidden="true"></span>
        <div class="stat-value text-cyan notranslate" translate="no">${Core.escapeHtml(hashLabel)}</div>
        <div class="stat-label">${tr("kpi.hashrate")}</div>
      </article>
    `;
  }

  function wireWatchButtons(root) {
    const scope = root || document;
    scope.querySelectorAll(".btn-watch[data-watch-id]").forEach((btn) => {
      if (btn.dataset.wired === "1") return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const Auth = window.UsefulPowAuth;
        if (!Auth) return;
        const id = btn.getAttribute("data-watch-id");
        const on = Auth.toggleWatch(id);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        const icon = btn.querySelector("i");
        if (icon) icon.className = `bi ${on ? "bi-star-fill" : "bi-star"}`;
        const text = on ? tr("watch.remove") : tr("watch.add");
        let label = btn.querySelector("[data-watch-label]");
        if (!label) {
          label = btn.querySelector("span");
        }
        if (label) {
          label.textContent = text;
        } else {
          btn.innerHTML = `<i class="bi ${on ? "bi-star-fill" : "bi-star"}"></i> ${Core.escapeHtml(text)}`;
          btn.dataset.wired = "1";
        }
      });
    });
  }

  window.UsefulPowUI = {
    badgeForStatus,
    renderTags,
    renderSparkline,
    renderProjectLinks,
    renderProjectCard,
    renderTableRow,
    renderKpiCards,
    renderTopCoinRow,
    renderWatchlistRow,
    renderPoolMiniCard,
    renderCoinHeader,
    renderCoinStatRow,
    renderCoinInfoBar,
    renderHashrateBreakdown,
    renderPoolTable,
    wireWatchButtons,
  };
})();
