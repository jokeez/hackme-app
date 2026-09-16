(() => {
  "use strict";

  const Core = window.UsefulPowCore;
  const UI = window.UsefulPowUI;
  if (!Core || !UI) return;

  let projects = [];
  const liveStats = new Map();
  const selected = ["hackme", "gridcoin-watch", ""];

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  function getSelectedProjects() {
    return selected
      .map((id) => projects.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 3);
  }

  function renderPickers() {
    const host = $("compare-pickers");
    if (!host) return;
    host.innerHTML = [0, 1, 2]
      .map((i) => {
        const opts = projects
          .map(
            (p) =>
              `<option value="${Core.escapeAttr(p.id)}" ${selected[i] === p.id ? "selected" : ""}>${Core.escapeHtml(
                `${p.name} (${p.ticker || p.id})`
              )}</option>`
          )
          .join("");
        return `
          <div class="form-field">
            <label>${Core.escapeHtml(t("compare.slot", { n: i + 1 }))}</label>
            <select class="compare-select notranslate" translate="no" data-slot="${i}">
              <option value="">—</option>
              ${opts}
            </select>
          </div>`;
      })
      .join("");

    host.querySelectorAll(".compare-select").forEach((sel) => {
      sel.addEventListener("change", () => {
        const slot = Number(sel.getAttribute("data-slot"));
        selected[slot] = sel.value || "";
        renderTable();
        syncUrl();
      });
    });
  }

  function row(label, cells) {
    return `<tr><th scope="row">${Core.escapeHtml(label)}</th>${cells
      .map((c) => `<td>${c}</td>`)
      .join("")}</tr>`;
  }

  function renderTable() {
    const list = getSelectedProjects();
    const head = $("compare-head");
    const body = $("compare-body");
    if (!head || !body) return;

    if (!list.length) {
      head.innerHTML = "";
      body.innerHTML = `<tr><td class="table-empty">${Core.escapeHtml(t("compare.empty"))}</td></tr>`;
      return;
    }

    head.innerHTML = `<tr><th></th>${list
      .map(
        (p) =>
          `<th><a class="table-link" href="project.html?id=${encodeURIComponent(p.id)}"><strong class="notranslate" translate="no">${Core.escapeHtml(
            p.name
          )}</strong></a><br><span class="badge badge-symbol notranslate" translate="no">${Core.escapeHtml(
            p.ticker || "—"
          )}</span></th>`
      )
      .join("")}</tr>`;

    const cells = (fn) => list.map(fn);

    body.innerHTML = [
      row(
        t("table.status"),
        cells((p) => UI.badgeForStatus(p.status))
      ),
      row(
        t("detail.usefulType"),
        cells((p) => `<span class="notranslate" translate="no">${Core.escapeHtml(p.useful_type || "—")}</span>`)
      ),
      row(
        t("meta.usefulWork"),
        cells((p) => `<span class="notranslate" translate="no">${Core.escapeHtml(p.useful_work || "—")}</span>`)
      ),
      row(
        t("table.hashrate"),
        cells((p) => {
          const s = liveStats.get(p.id);
          return `<span class="notranslate" translate="no">${Core.escapeHtml((s && s.hashrate) || "—")}</span>`;
        })
      ),
      row(
        t("spark.label"),
        cells((p) => UI.renderSparkline(Core.getHistorySeries(p.id), { width: 100, height: 24 }))
      ),
      row(
        t("table.workers"),
        cells((p) => {
          const s = liveStats.get(p.id);
          return `<span class="notranslate" translate="no">${Core.escapeHtml((s && s.workers) || "—")}</span>`;
        })
      ),
      row(
        t("detail.apiStatus"),
        cells((p) => {
          const s = liveStats.get(p.id);
          const st = (s && s.status) || "—";
          return `<span class="${Core.statusClass(st)} notranslate" translate="no">${Core.escapeHtml(st)}</span>`;
        })
      ),
      row(
        t("table.pools"),
        cells((p) => String((p.pools || []).length || (p.pool ? 1 : 0)))
      ),
      row(
        t("common.details"),
        cells(
          (p) =>
            `<a class="table-link" href="project.html?id=${encodeURIComponent(p.id)}">${Core.escapeHtml(
              t("common.details")
            )}</a>`
        )
      ),
    ].join("");
  }

  function syncUrl() {
    const ids = selected.filter(Boolean);
    const q = ids.length ? `?ids=${ids.map(encodeURIComponent).join(",")}` : "";
    history.replaceState(null, "", `compare.html${q}`);
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("ids") || params.get("id") || "";
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (ids.length) {
      selected[0] = ids[0] || "";
      selected[1] = ids[1] || "";
      selected[2] = ids[2] || "";
    }
  }

  async function refreshStats() {
    await Promise.all(
      projects.map(async (p) => {
        const stats = await Core.fetchProjectStats(p);
        if (stats) {
          liveStats.set(p.id, stats);
          Core.pushHistoryPoint(p.id, stats);
        }
      })
    );
    renderTable();
  }

  async function init() {
    readUrl();
    const registry = await Core.loadRegistry("./assets/projects.json");
    projects = registry.projects || [];
    renderPickers();
    renderTable();
    await refreshStats();

    const runBtn = $("btn-compare-run");
    if (runBtn) runBtn.addEventListener("click", () => void refreshStats());

    const clearBtn = $("btn-compare-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        selected[0] = "";
        selected[1] = "";
        selected[2] = "";
        renderPickers();
        renderTable();
        syncUrl();
      });
    }

    window.addEventListener("usefulpow:langchange", () => {
      renderPickers();
      renderTable();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
