#!/usr/bin/env node
/**
 * Validate projects.json shape for handoff safety.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function load(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function requireKeys(obj, keys, label) {
  for (const k of keys) {
    assert.ok(obj && Object.prototype.hasOwnProperty.call(obj, k), `${label} missing ${k}`);
  }
}

const projectsDoc = load("assets/projects.json");
requireKeys(projectsDoc, ["schema_version", "projects"], "projects.json");
assert.ok(Array.isArray(projectsDoc.projects), "projects must be array");
assert.ok(projectsDoc.projects.length >= 1, "at least one project");

const ids = new Set();
for (const p of projectsDoc.projects) {
  requireKeys(p, ["id", "name", "ticker", "status", "useful_work", "useful_type"], `project`);
  assert.ok(!ids.has(p.id), `duplicate project id ${p.id}`);
  ids.add(p.id);
  assert.ok(["verified", "watchlist", "draft"].includes(p.status), `bad status ${p.status}`);
  if (p.status === "verified") {
    assert.ok(p.api && p.api.type, `${p.id} verified needs api.type`);
  }
}

assert.ok(ids.has("hackme"), "hackme project required");

assert.ok(!fs.existsSync(path.join(ROOT, "exchanges.html")), "exchanges.html should be removed");
assert.ok(!fs.existsSync(path.join(ROOT, "assets/exchanges.json")), "exchanges.json should be removed");

console.log(`ok projects.json (${projectsDoc.projects.length} projects)`);
console.log("ok exchanges surface removed");
console.log("\n2 registry schema checks passed");
