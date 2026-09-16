(() => {
  "use strict";

  const Auth = window.UsefulPowAuth;
  const I18n = window.UsefulPowI18n;
  const Core = window.UsefulPowCore;

  let projects = [];

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, vars) {
    return I18n ? I18n.t(key, vars) : key;
  }

  function requireAuth() {
    if (!Auth || !Auth.isLoggedIn()) {
      window.location.replace("login.html");
      return null;
    }
    return Auth.readSession();
  }

  function renderKpis(counts) {
    const el = $("dash-kpi");
    if (!el) return;
    el.innerHTML = `
      <article class="stat-card stat-accent-primary">
        <span class="stat-icon bi bi-inbox"></span>
        <div class="stat-value text-primary">${counts.submissions}</div>
        <div class="stat-label">${t("dash.stat.submissions")}</div>
      </article>
      <article class="stat-card stat-accent-info">
        <span class="stat-icon bi bi-star"></span>
        <div class="stat-value text-info">${counts.watchlist}</div>
        <div class="stat-label">${t("dash.stat.watchlist")}</div>
      </article>
      <article class="stat-card stat-accent-success">
        <span class="stat-icon bi bi-coin"></span>
        <div class="stat-value text-success">${counts.projects}</div>
        <div class="stat-label">${t("dash.stat.projects")}</div>
      </article>
    `;
  }

  function renderSubmissions(list) {
    const host = $("dash-submissions-list");
    if (!host) return;

    if (!list.length) {
      host.innerHTML = `<div class="empty-state">${t("dash.noSubmissions")}</div>`;
      return;
    }

    host.innerHTML = list
      .map((item) => {
        const p = (item.payload && item.payload.project) || {};
        const name = Core ? Core.escapeHtml(p.name || "—") : p.name || "—";
        const ticker = Core ? Core.escapeHtml(p.ticker || "") : p.ticker || "";
        const when = Core ? Core.escapeHtml(item.saved_at || "") : item.saved_at || "";
        const status = item.status || "draft";
        return `
          <article class="submission-row">
            <div>
              <strong class="notranslate" translate="no">${name}</strong>
              ${ticker ? `<span class="badge badge-symbol notranslate" translate="no">${ticker}</span>` : ""}
              <span class="ex-badge ex-planned notranslate" translate="no">${Core ? Core.escapeHtml(status) : status}</span>
              <div class="muted-inline notranslate" translate="no">${when}</div>
            </div>
            <pre class="submission-preview notranslate" translate="no">${
              Core ? Core.escapeHtml(JSON.stringify(item.payload, null, 2).slice(0, 280)) : ""
            }…</pre>
          </article>
        `;
      })
      .join("");
  }

  function renderWatchlist() {
    const host = $("dash-watchlist");
    if (!host || !Auth) return;
    const ids = Auth.readWatchlist();
    if (!ids.length) {
      host.innerHTML = `<div class="empty-state">${t("dash.noWatchlist")}</div>`;
      return;
    }
    host.innerHTML = `<div class="dash-watch-grid">${ids
      .map((id) => {
        const p = projects.find((x) => x.id === id);
        if (!p) {
          return `<article class="submission-row"><strong class="notranslate" translate="no">${
            Core ? Core.escapeHtml(id) : id
          }</strong>
            <button type="button" class="btn btn-sm btn-secondary btn-unwatch" data-watch-id="${
              Core ? Core.escapeAttr(id) : id
            }">${t("watch.remove")}</button></article>`;
        }
        return `
          <article class="submission-row">
            <div>
              <a class="table-link" href="project.html?id=${encodeURIComponent(p.id)}">
                <strong class="notranslate" translate="no">${Core.escapeHtml(p.name)}</strong>
              </a>
              <span class="badge badge-symbol notranslate" translate="no">${Core.escapeHtml(p.ticker || "—")}</span>
              <div class="muted-inline notranslate" translate="no">${Core.escapeHtml(p.useful_type || "")}</div>
            </div>
            <div class="btn-row">
              <a class="btn btn-sm btn-outline-primary" href="compare.html?ids=${encodeURIComponent(p.id)}">${t(
                "nav.compare"
              )}</a>
              <button type="button" class="btn btn-sm btn-secondary btn-unwatch" data-watch-id="${Core.escapeAttr(
                p.id
              )}">${t("watch.remove")}</button>
            </div>
          </article>`;
      })
      .join("")}</div>`;

    host.querySelectorAll(".btn-unwatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        Auth.toggleWatch(btn.getAttribute("data-watch-id"));
        renderWatchlist();
        void refreshCounts();
      });
    });
  }

  function renderProfile(session) {
    const dl = document.querySelector("#dash-profile .profile-dl");
    if (!dl) return;
    dl.innerHTML = `
      <dt>${t("profile.email")}</dt><dd class="notranslate" translate="no">${Core ? Core.escapeHtml(session.email) : session.email}</dd>
      <dt>${t("profile.name")}</dt><dd class="notranslate" translate="no">${Core ? Core.escapeHtml(session.displayName || "—") : session.displayName}</dd>
      <dt>${t("profile.role")}</dt><dd class="notranslate" translate="no">${Core ? Core.escapeHtml(session.role || "developer") : session.role}</dd>
    `;
  }

  async function loadCounts() {
    let projectCount = 0;
    try {
      const pr = await fetch("./assets/projects.json", { cache: "no-store" });
      if (pr.ok) {
        const data = await pr.json();
        projects = data.projects || [];
        projectCount = projects.length;
      }
    } catch (_) {
      /* ignore */
    }
    return {
      submissions: Auth.readSubmissions().length,
      watchlist: Auth.readWatchlist().length,
      projects: projectCount,
    };
  }

  async function refreshCounts() {
    renderKpis(await loadCounts());
  }

  async function init() {
    const session = requireAuth();
    if (!session) return;

    const welcome = $("dash-welcome");
    if (welcome) {
      welcome.textContent = `${t("dash.welcome", { name: session.displayName })} · ${t("dash.signedIn")}`;
    }

    renderProfile(session);
    renderSubmissions(Auth.readSubmissions());
    const counts = await loadCounts();
    renderKpis(counts);
    renderWatchlist();

    const logoutBtn = $("btn-dash-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        Auth.clearSession();
        window.location.href = "login.html";
      });
    }

    window.addEventListener("usefulpow:langchange", async () => {
      if (welcome) {
        welcome.textContent = `${t("dash.welcome", { name: session.displayName })} · ${t("dash.signedIn")}`;
      }
      renderProfile(session);
      renderSubmissions(Auth.readSubmissions());
      renderWatchlist();
      renderKpis(await loadCounts());
    });

    window.addEventListener("usefulpow:watchchange", async () => {
      renderWatchlist();
      renderKpis(await loadCounts());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }
})();
