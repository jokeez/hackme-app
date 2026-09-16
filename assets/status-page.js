(() => {
  "use strict";

  const Core = window.UsefulPowCore;
  if (!Core) return;

  let registry = { projects: [] };
  let lastBundle = null;

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  async function timedFetch(url) {
    const t0 = performance.now();
    try {
      const resp = await fetch(url, { cache: "no-store" });
      const ms = Math.round(performance.now() - t0);
      let json = null;
      try {
        json = await resp.json();
      } catch (_) {
        json = null;
      }
      return { ok: resp.ok, status: resp.status, ms, json };
    } catch (_) {
      return { ok: false, status: 0, ms: Math.round(performance.now() - t0), json: null };
    }
  }

  function statusBadge(ok, label) {
    if (ok) return `<span class="ex-badge ex-live">${Core.escapeHtml(label || "OK")}</span>`;
    return `<span class="ex-badge ex-planned">${Core.escapeHtml(label || "DOWN")}</span>`;
  }

  function renderKpis(bundle) {
    const el = $("status-kpi");
    if (!el) return;
    const { probes, adapters } = bundle;
    const okProbes = probes.filter((p) => p.ok).length;
    const live = adapters.filter((a) => a.ok).length;
    el.innerHTML = `
      <article class="stat-card">
        <i class="bi bi-heart-pulse stat-icon text-success"></i>
        <div class="stat-value text-success">${okProbes}/${probes.length}</div>
        <div class="stat-label">${Core.escapeHtml(t("status.kpi.probes"))}</div>
      </article>
      <article class="stat-card">
        <i class="bi bi-diagram-3 stat-icon text-info"></i>
        <div class="stat-value text-info">${live}/${adapters.length}</div>
        <div class="stat-label">${Core.escapeHtml(t("status.kpi.adapters"))}</div>
      </article>
      <article class="stat-card">
        <i class="bi bi-coin stat-icon text-primary"></i>
        <div class="stat-value text-primary">${(registry.projects || []).length}</div>
        <div class="stat-label">${Core.escapeHtml(t("kpi.listedCoins"))}</div>
      </article>
      <article class="stat-card">
        <i class="bi bi-shield-check stat-icon text-warning"></i>
        <div class="stat-value text-warning">${(registry.projects || []).filter((p) => p.status === "verified").length}</div>
        <div class="stat-label">${Core.escapeHtml(t("filter.statusVerified"))}</div>
      </article>
    `;
  }

  function renderProbes(probes) {
    const tbody = $("status-probes-body");
    if (!tbody) return;
    tbody.innerHTML = probes
      .map(
        (p) => `
      <tr>
        <td><strong>${Core.escapeHtml(p.name)}</strong></td>
        <td>${statusBadge(p.ok, p.ok ? "OK" : "FAIL")}</td>
        <td class="notranslate" translate="no">${Core.escapeHtml(p.detail || "—")}</td>
        <td class="notranslate" translate="no">${p.ms != null ? `${p.ms} ms` : "—"}</td>
      </tr>`
      )
      .join("");
  }

  function renderAdapters(adapters) {
    const tbody = $("status-adapters-body");
    if (!tbody) return;
    if (!adapters.length) {
      tbody.innerHTML = `<tr><td colspan="5">${Core.escapeHtml(t("empty.noVerified"))}</td></tr>`;
      return;
    }
    tbody.innerHTML = adapters
      .map((a) => {
        const p = a.project;
        return `
        <tr>
          <td>
            <a class="table-link" href="project.html?id=${encodeURIComponent(p.id)}">
              <strong class="notranslate" translate="no">${Core.escapeHtml(p.name)}</strong>
            </a>
            <br><span class="badge badge-symbol notranslate" translate="no">${Core.escapeHtml(p.ticker || "—")}</span>
          </td>
          <td>${statusBadge(a.ok, a.ok ? "LIVE" : a.hasApi ? "DEGRADED" : "N/A")}</td>
          <td class="notranslate" translate="no">${Core.escapeHtml((a.stats && a.stats.hashrate) || "—")}</td>
          <td class="notranslate" translate="no">${Core.escapeHtml((a.stats && a.stats.workers) || "—")}</td>
          <td class="${Core.statusClass(a.stats && a.stats.status)} notranslate" translate="no">${Core.escapeHtml(
            (a.stats && a.stats.status) || (a.hasApi ? "unreachable" : "no adapter")
          )}</td>
        </tr>`;
      })
      .join("");
  }

  function paint(bundle) {
    lastBundle = bundle;
    renderKpis(bundle);
    renderProbes(bundle.probes);
    renderAdapters(bundle.adapters);
    const upd = $("status-updated");
    if (upd) upd.textContent = t("status.updated", { ago: Core.fmtAgo(bundle.ts) });
  }

  async function runProbes() {
    const btn = $("btn-status-refresh");
    if (btn) btn.disabled = true;

    const [health, projectsFile, metrics, work] = await Promise.all([
      timedFetch("/healthz"),
      timedFetch("./assets/projects.json"),
      timedFetch("/proxy/hackme/metrics"),
      timedFetch("/proxy/hackme/work-stats"),
    ]);

    if (projectsFile.json) registry = projectsFile.json;

    const probes = [
      {
        name: t("status.probe.health"),
        ok: !!(health.ok && health.json && health.json.ok),
        detail: health.ok ? "healthz ok" : "healthz unreachable",
        ms: health.ms,
      },
      {
        name: t("status.probe.projects"),
        ok: !!(projectsFile.ok && projectsFile.json && Array.isArray(projectsFile.json.projects)),
        detail: projectsFile.json
          ? `schema ${projectsFile.json.schema_version} · ${(projectsFile.json.projects || []).length} projects`
          : "projects.json fail",
        ms: projectsFile.ms,
      },
      {
        name: t("status.probe.hackmeMetrics"),
        ok: !!(metrics.ok && metrics.json),
        detail: metrics.ok ? "proxy /proxy/hackme/metrics" : "proxy metrics fail (expected off localhost)",
        ms: metrics.ms,
      },
      {
        name: t("status.probe.hackmeWork"),
        ok: !!(work.ok && work.json),
        detail: work.ok ? "proxy /proxy/hackme/work-stats" : "proxy work-stats fail",
        ms: work.ms,
      },
    ];

    const adapters = await Promise.all(
      (registry.projects || []).map(async (p) => {
        const hasApi = !!(p.api && p.api.type);
        const stats = hasApi || p.static_stats ? await Core.fetchProjectStats(p) : null;
        if (stats) Core.pushHistoryPoint(p.id, stats);
        return {
          project: p,
          hasApi,
          stats,
          ok: !!(stats && stats.ok),
        };
      })
    );

    paint({ probes, adapters, ts: Date.now() });
    if (btn) btn.disabled = false;
  }

  async function init() {
    await runProbes();
    const btn = $("btn-status-refresh");
    if (btn) btn.addEventListener("click", () => void runProbes());
    window.addEventListener("usefulpow:langchange", () => {
      if (lastBundle) paint(lastBundle);
    });
    setInterval(() => void runProbes(), Core.POLL_MS * 2);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
