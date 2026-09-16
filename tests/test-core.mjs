import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const Core = require("../assets/core.js");

function testFmtPoolHashrate() {
  assert.equal(Core.fmtPoolHashrate(0, false), "—");
  assert.equal(Core.fmtPoolHashrate(0.5, false), "500.0 GH/s");
  assert.equal(Core.fmtPoolHashrate(1.25, false), "1.25 TH/s");
  assert.match(Core.fmtPoolHashrate(0.5, true), /\*$/);
}

function testParseHashrateGh() {
  assert.equal(Core.parseHashrateGh("500.0 GH/s"), 500);
  assert.equal(Core.parseHashrateGh("1.25 TH/s"), 1250);
  assert.equal(Core.parseHashrateGh("—"), 0);
}

function testNormalizeHackMeStats() {
  const project = { id: "hackme", ticker: "HMC" };
  const global = {
    ok: true,
    chain: { tip_height: 12345 },
    network: { global_hashrate_th_s: 0.836, global_mock: false },
    work: { pool_hashrate_gh_s: 836, miners: 33, ok: true, target_mod: 1_000_000_000 },
  };
  const work = { base_reward_hmc: 0.01, workers_count: 33, issued_ranges: 100 };

  const stats = Core.normalizeHackMeStats(project, global, work);
  assert.equal(stats.project_id, "hackme");
  assert.match(stats.hashrate, /GH\/s/);
  assert.equal(stats.workers, "33");
  assert.equal(stats.height_num, 12345);
  assert.match(stats.reward, /HMC/);
  assert.equal(stats.ok, true);
}

function testFilterAndSort() {
  const projects = [
    { id: "a", name: "Alpha", status: "verified", useful_type: "security-fuzz", tags: ["gpu"] },
    { id: "b", name: "Beta", status: "watchlist", useful_type: "research-pow", tags: ["cpu"] },
  ];
  const stats = new Map([
    ["a", { hashrate_gh: 800, workers_num: 10, height_num: 100, status: "online", ok: true }],
    ["b", { hashrate_gh: 0, workers_num: 0, height_num: 0, status: "watchlist", ok: false }],
  ]);

  const verified = Core.filterProjects(projects, { status: "verified" });
  assert.equal(verified.length, 1);
  assert.equal(verified[0].id, "a");

  const sorted = Core.sortProjects(projects, "hashrate", stats);
  assert.equal(sorted[0].id, "a");

  const agg = Core.aggregateStats([stats.get("a"), stats.get("b")]);
  assert.equal(agg.okCount, 1);
  assert.equal(agg.responseCount, 2);
  assert.equal(agg.totalHashrateGH, 800);
}

function testResolveHackMeApi() {
  const project = {
    site: "https://hackme.tech/",
    api: { metrics: "/pool/api/global/metrics", work_stats: "/pool/coordinator/api/work/stats" },
  };

  const local = Core.resolveHackMeApi(project, { hostname: "127.0.0.1" });
  assert.equal(local.metrics, "/proxy/hackme/metrics");

  const prod = Core.resolveHackMeApi(project, { hostname: "hackme.tech" });
  assert.equal(prod.metrics, "/pool/api/global/metrics");

  const external = Core.resolveHackMeApi(project, { hostname: "example.com" });
  assert.match(external.metrics, /^https:\/\/hackme\.tech/);
}

function testHistoryAndValidate() {
  const mem = {};
  globalThis.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => {
      mem[k] = String(v);
    },
    removeItem: (k) => {
      delete mem[k];
    },
  };

  Core.pushHistoryPoint("hackme", { ts: 1000, hashrate_gh: 10, workers_num: 1, ok: true });
  Core.pushHistoryPoint("hackme", { ts: 20000, hashrate_gh: 12, workers_num: 2, ok: true });
  const series = Core.getHistorySeries("hackme");
  assert.equal(series.length, 2);
  assert.equal(series[1].hashrate_gh, 12);

  return Core.validateMetricsUrl("not-a-url").then((r) => {
    assert.equal(r.ok, false);
    assert.equal(r.error, "invalid_url");
  });
}

const tests = [
  testFmtPoolHashrate,
  testParseHashrateGh,
  testNormalizeHackMeStats,
  testFilterAndSort,
  testResolveHackMeApi,
  testHistoryAndValidate,
];

let failed = 0;
for (const t of tests) {
  try {
    const ret = t();
    if (ret && typeof ret.then === "function") {
      await ret;
    }
    console.log(`ok ${t.name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${t.name}:`, err.message);
  }
}

if (failed > 0) process.exit(1);
console.log(`\n${tests.length} tests passed`);
