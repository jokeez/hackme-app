/**
 * Useful PoW Index — shared core (browser + Node tests).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.UsefulPowCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const POLL_MS = 30_000;
  const FETCH_TIMEOUT_MS = 4500;
  const CACHE_KEY = "useful-pow.stats.v1";
  const HISTORY_KEY = "useful-pow.history.v1";
  const HISTORY_MAX_POINTS = 48;

  function fmtPoolHashrate(ths, mock) {
    const th = Number(ths);
    if (!Number.isFinite(th) || th <= 0) return "—";
    const star = mock ? " *" : "";
    if (th < 1) {
      const gh = th * 1000;
      const ghStr = gh < 0.01 ? gh.toFixed(4) : gh < 1 ? gh.toFixed(2) : gh.toFixed(1);
      return `${ghStr} GH/s${star}`;
    }
    return `${th.toFixed(2)} TH/s${star}`;
  }

  function parseHashrateGh(text) {
    if (!text || text === "—") return 0;
    const m = String(text).match(/^([\d.]+)\s+(GH|TH)\/s/);
    if (!m) return 0;
    const val = Number(m[1]);
    if (!Number.isFinite(val)) return 0;
    return m[2] === "TH" ? val * 1000 : val;
  }

  function fmtAgo(ts) {
    const t = Number(ts);
    if (!Number.isFinite(t) || t <= 0) return "";
    const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s.startsWith("online")) return "status-online";
    if (s === "degraded") return "status-degraded";
    return "status-offline";
  }

  function normalizeHackMeStats(project, global, work) {
    let poolTH = NaN;
    let poolMock = false;

    if (global && global.network) {
      poolTH = Number(global.network.global_hashrate_th_s);
      poolMock = global.network.global_mock === true;
    }
    if ((!Number.isFinite(poolTH) || poolTH <= 0) && global && global.work) {
      const gh = Number(global.work.pool_hashrate_gh_s);
      if (Number.isFinite(gh) && gh > 0) poolTH = gh / 1000;
    }
    if ((!Number.isFinite(poolTH) || poolTH <= 0) && work) {
      const ghDirect = Number(work.pool_hashrate_gh_s);
      if (Number.isFinite(ghDirect) && ghDirect > 0) poolTH = ghDirect / 1000;
    }

    let tipHeight = NaN;
    if (global && global.chain) {
      const canon = Number(global.chain.canonical_tip_height);
      const local = Number(global.chain.tip_height);
      if (Number.isFinite(canon) && canon > 0) tipHeight = canon;
      else if (Number.isFinite(local) && local >= 0) tipHeight = local;
    }

    let diff = global && global.work ? Number(global.work.target_mod) : NaN;
    if (!Number.isFinite(diff) || diff <= 0) diff = Number(work && work.target_mod);

    let reward = Number(work && work.base_reward_hmc);
    if (!Number.isFinite(reward) || reward <= 0) {
      reward = Number(work && work.found_bonus_hmc);
    }

    const online = Number(
      (work && work.workers_online) ||
        (work && work.miners) ||
        (global && global.work && global.work.miners) ||
        NaN
    );
    const known = Number(
      (work && work.workers_count) ||
        (global && global.work && global.work.workers_count) ||
        0
    );
    const workers = Number.isFinite(online) && online >= 0 ? online : known;

    const poolOk =
      (global && global.work && global.work.ok) ||
      (work && work.issued_ranges != null) ||
      (global && global.ok);

    let status = "degraded";
    if (poolOk) status = workers > 0 ? "online" : "online · idle";

    const payout = Number(global && global.work && global.work.total_payout_hmc);
    const issued = Number(global && global.work && global.work.issued_ranges);

    return {
      project_id: project.id,
      hashrate: fmtPoolHashrate(poolTH, poolMock),
      hashrate_gh: Number.isFinite(poolTH) && poolTH > 0 ? poolTH * 1000 : 0,
      workers: Number.isFinite(workers) && workers >= 0 ? String(Math.floor(workers)) : "—",
      workers_num: Number.isFinite(workers) ? workers : 0,
      height:
        Number.isFinite(tipHeight) && tipHeight >= 0
          ? Math.floor(tipHeight).toLocaleString("en-US")
          : "—",
      height_num: Number.isFinite(tipHeight) ? tipHeight : 0,
      reward:
        Number.isFinite(reward) && reward > 0
          ? `${reward.toFixed(6)} ${project.ticker || "HMC"}`
          : "—",
      reward_num: Number.isFinite(reward) ? reward : 0,
      difficulty:
        Number.isFinite(diff) && diff > 0 ? Math.floor(diff).toLocaleString("en-US") : "—",
      difficulty_num: Number.isFinite(diff) ? diff : 0,
      total_payout:
        Number.isFinite(payout) && payout > 0
          ? `${payout.toFixed(4)} ${project.ticker || "HMC"}`
          : "—",
      issued_ranges: Number.isFinite(issued) ? issued : null,
      status,
      ts: Date.now(),
      ok: !!poolOk,
      mock: poolMock,
    };
  }

  function resolveHackMeApi(project, locationObj) {
    const loc = locationObj || (typeof window !== "undefined" ? window.location : { hostname: "" });
    const api = project.api || {};
    const host = (loc.hostname || "").toLowerCase();
    const local = host === "localhost" || host === "127.0.0.1";

    if (local) {
      return {
        metrics: "/proxy/hackme/metrics",
        work_stats: "/proxy/hackme/work-stats",
      };
    }

    const onHackMe = host === "hackme.tech" || host === "www.hackme.tech";
    if (onHackMe) {
      return {
        metrics: api.metrics || "/pool/api/global/metrics",
        work_stats: api.work_stats || "/pool/coordinator/api/work/stats",
      };
    }

    const base = String(project.site || "https://hackme.tech/").replace(/\/$/, "");
    const metricsPath = api.metrics || "/pool/api/global/metrics";
    const workPath = api.work_stats || "/pool/coordinator/api/work/stats";
    return {
      metrics: metricsPath.startsWith("http") ? metricsPath : `${base}${metricsPath}`,
      work_stats: workPath.startsWith("http") ? workPath : `${base}${workPath}`,
    };
  }

  function filterProjects(projects, filters) {
    const q = String(filters.query || "")
      .trim()
      .toLowerCase();
    const status = filters.status || "all";
    const type = filters.type || "all";
    const tag = filters.tag || "all";

    return projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (type !== "all" && p.useful_type !== type) return false;
      if (tag !== "all" && !(p.tags || []).includes(tag)) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.ticker,
        p.useful_work,
        p.useful_type,
        p.summary,
        ...(p.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function sortProjects(projects, sortKey, statsMap) {
    const list = [...projects];
    const stats = statsMap || new Map();

    list.sort((a, b) => {
      const sa = stats.get(a.id) || {};
      const sb = stats.get(b.id) || {};

      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "workers":
          return (sb.workers_num || 0) - (sa.workers_num || 0);
        case "height":
          return (sb.height_num || 0) - (sa.height_num || 0);
        case "status": {
          const rank = (s) => (String(s.status || "").startsWith("online") ? 2 : s.ok ? 1 : 0);
          return rank(sb) - rank(sa);
        }
        case "hashrate":
        default:
          return (sb.hashrate_gh || 0) - (sa.hashrate_gh || 0);
      }
    });

    return list;
  }

  function aggregateStats(results) {
    const responses = results.filter(Boolean);
    const okCount = responses.filter((s) => s.ok).length;
    const totalHashrateGH = responses.reduce(
      (sum, s) => sum + (s.hashrate_gh ? s.hashrate_gh : 0),
      0
    );
    const totalWorkers = responses.reduce(
      (sum, s) => sum + (s.workers_num ? s.workers_num : 0),
      0
    );
    return { okCount, responseCount: responses.length, totalHashrateGH, totalWorkers };
  }

  async function fetchJson(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { cache: "no-store", signal: ctrl.signal });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchProjectStats(project, locationObj) {
    const api = project.api || {};
    if (api.type === "hackme") {
      const urls = resolveHackMeApi(project, locationObj);
      const [global, work] = await Promise.all([
        urls.metrics ? fetchJson(urls.metrics) : null,
        urls.work_stats ? fetchJson(urls.work_stats) : null,
      ]);
      if (!global && !work) return null;
      return normalizeHackMeStats(project, global, work);
    }
    if (project.static_stats) {
      return { ...project.static_stats, project_id: project.id, ts: Date.now(), ok: false };
    }
    return null;
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
    } catch (_) {}
  }

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function writeHistory(store) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function pushHistoryPoint(projectId, stats) {
    if (!projectId || !stats) return;
    const store = readHistory();
    const series = Array.isArray(store[projectId]) ? store[projectId] : [];
    const last = series[series.length - 1];
    const point = {
      ts: stats.ts || Date.now(),
      hashrate_gh: Number(stats.hashrate_gh) || 0,
      workers_num: Number(stats.workers_num) || 0,
      ok: !!stats.ok,
    };
    if (last && Math.abs(last.ts - point.ts) < 8_000) {
      series[series.length - 1] = point;
    } else {
      series.push(point);
    }
    while (series.length > HISTORY_MAX_POINTS) series.shift();
    store[projectId] = series;
    writeHistory(store);
  }

  function getHistorySeries(projectId) {
    const store = readHistory();
    return Array.isArray(store[projectId]) ? store[projectId] : [];
  }

  /**
   * Client-side metrics endpoint validator (CORS-dependent off localhost).
   * Accepts absolute URL; returns structured checklist.
   */
  async function validateMetricsUrl(url) {
    const result = {
      url,
      ok: false,
      http_ok: false,
      json_ok: false,
      status: 0,
      error: null,
      fields: {},
      hints: [],
      sample: null,
    };
    if (!url || !/^https?:\/\//i.test(url)) {
      result.error = "invalid_url";
      result.hints.push("URL must start with http:// or https://");
      return result;
    }
    try {
      const data = await fetchJson(url, FETCH_TIMEOUT_MS);
      if (data == null) {
        result.error = "fetch_failed";
        result.hints.push("Request failed, timed out, or blocked by CORS");
        return result;
      }
      result.http_ok = true;
      result.json_ok = true;
      result.sample = data;

      const flat = flattenKeys(data);
      const checks = [
        { key: "ok", paths: ["ok", "work.ok"] },
        {
          key: "hashrate",
          paths: [
            "network.global_hashrate_th_s",
            "work.pool_hashrate_gh_s",
            "pool_hashrate_gh_s",
            "hashrate",
            "hashrate_gh",
          ],
        },
        {
          key: "workers",
          paths: ["work.miners", "work.workers_online", "workers", "miners"],
        },
        {
          key: "height",
          paths: ["chain.canonical_tip_height", "chain.tip_height", "height"],
        },
      ];
      checks.forEach((c) => {
        const found = c.paths.find((p) => pathExists(data, p) || flat.has(p));
        result.fields[c.key] = !!found;
      });
      const present = Object.values(result.fields).filter(Boolean).length;
      result.ok = result.fields.hashrate || result.fields.workers || result.fields.ok;
      if (!result.fields.hashrate) result.hints.push("Missing hashrate field (GH/s or TH/s)");
      if (!result.fields.workers) result.hints.push("Missing workers / miners count");
      if (present < 2) result.hints.push("Need at least hashrate or workers for live adapter");
      return result;
    } catch (err) {
      result.error = String(err && err.message ? err.message : err);
      result.hints.push("Unexpected validator error");
      return result;
    }
  }

  function pathExists(obj, path) {
    const parts = String(path).split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object" || !(p in cur)) return false;
      cur = cur[p];
    }
    return true;
  }

  function flattenKeys(obj, prefix, out) {
    const set = out || new Set();
    const pre = prefix || "";
    if (obj == null || typeof obj !== "object") return set;
    Object.keys(obj).forEach((k) => {
      const path = pre ? `${pre}.${k}` : k;
      set.add(path);
      if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
        flattenKeys(obj[k], path, set);
      }
    });
    return set;
  }

  async function loadRegistry(basePath) {
    const path = basePath || "./assets/projects.json";
    try {
      const resp = await fetch(path, { cache: "no-store" });
      if (!resp.ok) throw new Error("projects.json missing");
      return await resp.json();
    } catch (_) {
      return { projects: [], schema_version: 1 };
    }
  }

  function getProjectById(registry, id) {
    return (registry.projects || []).find((p) => p.id === id) || null;
  }

  function collectTags(projects) {
    const set = new Set();
    projects.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return [...set].sort();
  }

  function collectTypes(projects) {
    const set = new Set();
    projects.forEach((p) => {
      if (p.useful_type) set.add(p.useful_type);
    });
    return [...set].sort();
  }

  return {
    POLL_MS,
    FETCH_TIMEOUT_MS,
    CACHE_KEY,
    HISTORY_KEY,
    HISTORY_MAX_POINTS,
    fmtPoolHashrate,
    parseHashrateGh,
    fmtAgo,
    escapeHtml,
    escapeAttr,
    statusClass,
    normalizeHackMeStats,
    resolveHackMeApi,
    filterProjects,
    sortProjects,
    aggregateStats,
    fetchJson,
    fetchProjectStats,
    readCache,
    writeCache,
    readHistory,
    writeHistory,
    pushHistoryPoint,
    getHistorySeries,
    validateMetricsUrl,
    loadRegistry,
    getProjectById,
    collectTags,
    collectTypes,
  };
});
