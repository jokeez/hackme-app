#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${BASE_URL:-http://127.0.0.1:8765}"
PASS=0
FAIL=0

ok() { echo "  OK  $1"; PASS=$((PASS + 1)); }
bad() { echo "  FAIL $1"; FAIL=$((FAIL + 1)); }

check_status() {
  local url="$1"
  local expect="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$code" == "$expect" ]]; then ok "$url -> $code"; else bad "$url -> $code (want $expect)"; fi
}

check_contains() {
  local url="$1"
  local needle="$2"
  local body
  body="$(curl -s "$url")"
  if echo "$body" | grep -q "$needle"; then ok "$url contains '$needle'"; else bad "$url missing '$needle'"; fi
}

echo "== Useful PoW Index smoke tests =="
echo "BASE=$BASE"
echo

echo "-- Static pages --"
check_status "$BASE/index.html" 200
check_status "$BASE/project.html" 200
check_status "$BASE/project.html?id=hackme" 200
check_status "$BASE/assets/core.js" 200
check_status "$BASE/assets/index.js" 200
check_status "$BASE/assets/projects.json" 200
check_status "$BASE/assets/manifest.webmanifest" 200
check_status "$BASE/assets/logo-hex.png" 200
check_status "$BASE/assets/layout.js" 200
check_status "$BASE/assets/ui.js" 200
check_status "$BASE/assets/translate-guard.js" 200
check_status "$BASE/assets/i18n.js" 200
check_status "$BASE/assets/auth.js" 200
check_status "$BASE/assets/shell.js" 200
check_status "$BASE/login.html" 200
check_status "$BASE/dashboard.html" 200
check_status "$BASE/verified.html" 200
check_status "$BASE/compare.html" 200
check_status "$BASE/docs.html" 200
check_status "$BASE/badge.html" 200
check_status "$BASE/status.html" 200
check_status "$BASE/assets/login-page.js" 200
check_status "$BASE/assets/dashboard-page.js" 200
check_status "$BASE/assets/verified-page.js" 200
check_status "$BASE/assets/compare-page.js" 200
check_status "$BASE/assets/docs-page.js" 200
check_status "$BASE/assets/status-page.js" 200
check_status "$BASE/assets/badge.css" 200

echo
echo "-- Content checks --"
check_contains "$BASE/index.html" "navbar-tools"
check_contains "$BASE/index.html" "Useful PoW Index"
check_contains "$BASE/index.html" "project-grid"
check_contains "$BASE/index.html" "notranslate"
check_contains "$BASE/index.html" "stats-table-body"
check_contains "$BASE/index.html" "hub-canvas"
check_contains "$BASE/index.html" "translate-guard.js"
check_status "$BASE/exchanges.html" 404
check_contains "$BASE/project.html?id=hackme" "project-page.js"
check_contains "$BASE/assets/ui.js" "coin-header-card"
check_contains "$BASE/assets/translate-guard.js" "UsefulPowTranslateGuard"
check_contains "$BASE/login.html" "login-form"
check_contains "$BASE/dashboard.html" "dashboard-main"
check_contains "$BASE/assets/i18n.js" "UsefulPowI18n"

echo
echo "-- Dev proxy / health --"
check_status "$BASE/healthz" 200
check_contains "$BASE/healthz" '"ok": true'

METRICS="$(curl -s "$BASE/proxy/hackme/metrics")"
if echo "$METRICS" | grep -q '"ok"'; then ok "proxy metrics JSON"; else bad "proxy metrics JSON"; fi

WORK="$(curl -s "$BASE/proxy/hackme/work-stats")"
if echo "$WORK" | grep -q 'pool_hashrate_gh_s\|issued_ranges'; then ok "proxy work-stats JSON"; else bad "proxy work-stats JSON"; fi

echo
echo "-- Node unit tests --"
if node "$ROOT/tests/test-core.mjs"; then ok "test-core.mjs"; else bad "test-core.mjs"; fi
if node "$ROOT/tests/test-i18n.mjs"; then ok "test-i18n.mjs"; else bad "test-i18n.mjs"; fi
if node "$ROOT/tests/test-registry.mjs"; then ok "test-registry.mjs"; else bad "test-registry.mjs"; fi

echo
echo "-- i18n HTML hooks --"
check_contains "$BASE/index.html" 'data-i18n="home.faqTitle"'
check_contains "$BASE/index.html" 'btn-refresh-label'
check_contains "$BASE/index.html" 'data-i18n="home.lanesTitle"'
check_contains "$BASE/verified.html" 'btn-validate'
check_contains "$BASE/compare.html" 'compare-pickers'
check_contains "$BASE/docs.html" 'badge-snippet'
check_contains "$BASE/status.html" 'status-probes-body'
check_contains "$BASE/assets/auth.js" 'toggleWatch'
check_contains "$BASE/assets/core.js" 'validateMetricsUrl'
check_contains "$BASE/assets/core.js" 'pushHistoryPoint'
check_contains "$BASE/assets/ui.js" 'function tr('
check_contains "$BASE/assets/ui.js" 'renderSparkline'

echo
echo "Passed: $PASS  Failed: $FAIL"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
