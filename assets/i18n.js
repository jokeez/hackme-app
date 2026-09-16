(() => {
  "use strict";

  const STORAGE_KEY = "useful-pow.lang.v1";
  const DEFAULT_LANG = "en";

  const STRINGS = {
    en: {
      "nav.home": "Home",
      "nav.coins": "Coins",
      "nav.exchanges": "Exchanges",
      "nav.pools": "Pools",
      "nav.login": "Login",
      "nav.logout": "Logout",
      "nav.listProject": "List project",
      "nav.compare": "Compare",
      "nav.verified": "Get verified",
      "nav.docs": "Docs",
      "nav.more": "More",
      "nav.status": "Status",
      "nav.dashboard": "Dashboard",
      "nav.myCoins": "My Coins",
      "nav.myExchanges": "My Exchanges",
      "nav.myPools": "My Pools",
      "nav.profile": "Profile",
      "nav.mySubmissions": "My Submissions",
      "nav.developer": "Developer",
      "sidebar.explore": "EXPLORE",
      "sidebar.links": "LINKS",
      "sidebar.dashboard": "MY DASHBOARD",
      "sidebar.sub.home": "Curated useful mining",
      "sidebar.sub.exchanges": "Exchange registry",
      "sidebar.sub.project": "Project detail",
      "sidebar.sub.verified": "Get verified",
      "sidebar.sub.compare": "Compare projects",
      "sidebar.sub.docs": "Registry & embed",
      "sidebar.sub.status": "Ecosystem health",
      "sidebar.hackmeHub": "HackMe hub",
      "sidebar.submit": "Submit",
      "ticker.live": "LIVE",
      "ticker.listed": "Listed",
      "ticker.apisOk": "APIs ok",
      "ticker.aggregate": "Aggregate",
      "ticker.refresh": "Refresh",
      "ticker.refreshed": "Refreshed",
      "ticker.fetching": "fetching…",
      "ticker.updated": "updated {ago}",
      "ticker.partial": "partial · {ago} · some APIs unreachable",
      "kpi.listedCoins": "Listed Coins",
      "kpi.livePools": "Live Pool Groups",
      "kpi.liveAdapters": "Live Adapters",
      "kpi.adaptersHint": "read-only APIs",
      "kpi.exchanges": "Exchanges",
      "kpi.workers": "Active Workers",
      "kpi.hashrate": "Total Hashrate",
      "kpi.verified": "{n} verified",
      "cta.title": "List a useful-PoW project",
      "cta.body": "Manual review, live public API stats — no wallets.",
      "cta.list": "List project",
      "cta.hub": "HackMe hub",
      "cta.github": "GitHub",
      "cta.exchanges": "Exchanges",
      "cta.allCoins": "All coins",
      "home.topCoins": "Top by hashrate",
      "home.viewAll": "View all",
      "home.watchlistTitle": "Watchlist",
      "home.watchlistSub": "No live adapter yet.",
      "home.allCoins": "All coins",
      "home.poolsTitle": "Live pool",
      "home.poolsSub": "Coordinator metrics from public endpoints.",
      "home.liveCompare": "Compare",
      "home.allCoinsHeading": "All coins",
      "home.allCoinsSub": "Verified first — watchlist has no live adapter yet.",
      "home.liveStatsTitle": "Live pool",
      "home.liveStatsSub": "Metrics refresh from public endpoints.",
      "home.faqTitle": "FAQ",
      "home.faqSub": "How this index differs from profit boards.",
      "home.submitTitle": "Submit a project",
      "home.submitSub": "JSON bundle for manual review — no backend here.",
      "home.heroEyebrow": "HackMe · Useful PoW",
      "home.heroKicker": "One index · useful work only",
      "home.heroTitle": "Mine useful work, listed honestly",
      "home.release": "Release",
      "home.releaseVal": "Index prototype",
      "home.network": "Network",
      "home.networkChecking": "checking…",
      "home.networkLive": "adapters live",
      "audience.miners": "Miners",
      "audience.minersTitle": "Browse useful coins",
      "audience.minersDesc": "Verified listings · live public adapters",
      "audience.builders": "Builders",
      "audience.buildersTitle": "Get verified",
      "audience.buildersDesc": "Adapter contract · honest scope",
      "audience.reviewers": "Reviewers",
      "audience.reviewersTitle": "Compare & status",
      "audience.reviewersDesc": "Side-by-side · ecosystem probes",
      "cmd.search": "Search",
      "cmd.title": "Jump anywhere",
      "cmd.placeholder": "Search pages, coins, actions…",
      "cmd.empty": "No matches",
      "view.grid": "Grid view",
      "view.list": "List view",
      "lane.tagStart": "Start here",
      "home.heroBody": "Only networks where hash power does reviewable work. Live pool stats — no wallets, no desks.",
      "home.browseCoins": "Browse coins",
      "home.jumpLanes": "Lanes",
      "home.jumpPool": "Live pool",
      "home.lanesTitle": "Pick a lane",
      "home.lanesSub": "Start with coins and live pool. Verify or submit when you need it.",
      "lane.coinsTitle": "Useful-PoW listings",
      "lane.coinsBody": "Verified first. Watchlist means no live adapter yet.",
      "lane.poolTitle": "Live coordinators",
      "lane.poolBody": "Hashrate, workers, height — refreshed from public APIs.",
      "lane.verifyTitle": "Adapter contract",
      "lane.verifyBody": "Public metrics + honest scope. Manual review, not open signup.",
      "lane.submitTitle": "JSON for review",
      "lane.submitBody": "No backend on this prototype — copy a bundle and send it.",
      "table.coin": "Coin",
      "table.algorithm": "Algorithm",
      "table.pools": "Pools",
      "table.networkHash": "Network Hashrate",
      "table.type": "Type",
      "table.status": "Status",
      "table.poolHash": "Pool Hashrate",
      "table.project": "Project",
      "table.hashrate": "Hashrate",
      "table.workers": "Workers",
      "table.height": "Height",
      "table.reward": "Reward",
      "table.difficulty": "Difficulty",
      "table.pool": "Pool",
      "table.fee": "Fee",
      "table.payout": "Payout",
      "table.coordinator": "Coordinator",
      "table.region": "Region",
      "table.exchange": "Exchange",
      "table.pair": "Pair",
      "table.price": "Price",
      "table.vol24h": "Vol 24h",
      "table.trustNote": "Trust note",
      "table.metric": "Metric",
      "table.value": "Value",
      "table.notes": "Notes",
      "filter.search": "Search",
      "filter.searchPh": "Name, ticker, tags, useful work…",
      "filter.status": "Status",
      "filter.statusAll": "All statuses",
      "filter.statusVerified": "Verified",
      "filter.statusWatchlist": "Watchlist",
      "filter.statusDraft": "Draft",
      "filter.type": "Useful type",
      "filter.typeAll": "All types",
      "filter.sort": "Sort by",
      "filter.sortHash": "Hashrate",
      "filter.sortWorkers": "Workers",
      "filter.sortHeight": "Height",
      "filter.sortName": "Name",
      "filter.sortStatus": "Status",
      "filter.projects": "{n} projects",
      "filter.shown": "{shown} of {total} shown",
      "empty.loading": "Loading…",
      "empty.loadingRegistry": "Loading registry…",
      "empty.noMatch": "No projects match your filters.",
      "empty.noVerified": "No verified coins yet",
      "empty.beFirst": "Be the first to list your project!",
      "empty.noWatchlist": "No watchlist entries",
      "empty.watchlistHint": "Interesting useful-compute projects pending live adapters.",
      "empty.noPools": "No indexed pools yet",
      "empty.listPool": "List your mining pool!",
      "empty.noTableMatch": "No listings match filters",
      "submit.copy": "Copy JSON",
      "submit.copied": "Copied!",
      "submit.copyFail": "Copy failed",
      "submit.download": "Download JSON",
      "submit.intro":
        "Send the JSON to operators or open a GitHub issue. Review is manual.",
      "footer.disclaimer":
        "HackMe Useful PoW Index — prototype · read-only public APIs · no wallets. (*) = simulated network mode.",
      "footer.backIndex": "Back to index",
      "ex.heroEyebrow": "Inspired by mining-pool-stats exchange UX",
      "ex.heroTitle": "Exchanges for useful PoW assets",
      "ex.heroBody":
        "Planned, live, and roadmap desks — with operator notes and pair status. Not a ticker feed: manual curation aligned with each project's honest listing timeline.",
      "ex.heroNote": "{n} entries in registry · read-only prototype",
      "ex.allTitle": "All exchanges",
      "ex.allSub": "Status badges: planned paper, roadmap, live (when adapters exist).",
      "ex.trustTitle": "Trust checklist",
      "ex.trustSub": "Static trust panel pattern — domain age, operator, API status (from mining-pool-stats).",
      "ex.table.exchange": "Exchange",
      "ex.table.operator": "Operator",
      "ex.table.firstListed": "First listed",
      "ex.table.domain": "Domain / scope",
      "ex.table.api": "API",
      "ex.footerNote": "Exchange data is curated static JSON — verify on official project listing hubs before trading.",
      "login.title": "Developer Login",
      "login.sub": "Prototype — no backend. Use demo login or save a local session.",
      "login.email": "Email",
      "login.password": "Password",
      "login.submit": "Sign in",
      "login.demo": "Demo login",
      "login.noAccount": "No account?",
      "login.register": "Submit a listing",
      "login.back": "Back to index",
      "login.error": "Enter email and password, or use Demo login.",
      "login.success": "Signed in locally — dashboard unlocked.",
      "dash.title": "Developer Dashboard",
      "dash.sub": "Local prototype — manage draft submissions before HackMe hub merge.",
      "dash.overview": "Overview",
      "dash.welcome": "Welcome, {name}",
      "dash.signedIn": "Signed in locally (no server session).",
      "dash.submissions": "Saved submissions",
      "dash.submissionsSub": "JSON drafts stored in this browser only.",
      "dash.noSubmissions": "No saved submissions yet.",
      "dash.goSubmit": "Create submission",
      "dash.quickLinks": "Quick links",
      "dash.logout": "Log out",
      "dash.stat.submissions": "Submissions",
      "dash.stat.projects": "Listed projects",
      "dash.stat.exchanges": "Exchanges",
      "badge.verified": "verified",
      "badge.watchlist": "watchlist",
      "badge.draft": "draft",
      "project.notFound": "Project not found",
      "project.notFoundBody": "This listing is missing from the registry. Return to the index and pick a verified project.",
      "project.loading": "Loading project…",
      "common.open": "Open",
      "common.site": "Site",
      "common.pool": "Pool",
      "common.docs": "Docs",
      "common.details": "Details",
      "common.website": "Website",
      "common.explorer": "Explorer",
      "common.github": "GitHub",
      "common.refreshStats": "Refresh stats",
      "common.onExchanges": "on",
      "nav.menuToggle": "Toggle menu",
      "meta.usefulWork": "Useful work",
      "meta.hashrate": "Hashrate",
      "meta.workers": "Workers",
      "meta.status": "Status",
      "empty.loadingPools": "Loading pools…",
      "empty.exchanges": "No exchanges in registry yet.",
      "faq.q1.title": "Not a profit board",
      "faq.q1.body":
        "We list only projects where utility is explicit and reviewable — even if the list is small.",
      "faq.q2.title": "Why manual review?",
      "faq.q2.body": "\"Useful\" is easy to fake in marketing. A human checklist beats open registration spam.",
      "faq.q3.title": "Relationship to HackMe",
      "faq.q3.body":
        "Built as a handoff module for their hub — same visual language, zero wallet/escrow, read-only public APIs.",
      "faq.q4.title": "Watchlist vs verified",
      "faq.q4.body":
        "Watchlist = interesting useful-compute project without a live stats adapter yet. Verified = public API wired + criteria passed.",
      "submit.name": "Project name",
      "submit.ticker": "Ticker",
      "submit.usefulWork": "What does hash power do?",
      "submit.usefulType": "Useful type",
      "submit.algorithm": "Algorithm / coordinator",
      "submit.site": "Official site",
      "submit.docs": "Documentation",
      "submit.poolUrl": "Pool URL",
      "submit.metricsApi": "Public metrics API",
      "submit.github": "GitHub",
      "submit.summary": "Short summary",
      "submit.ph.name": "Example Network",
      "submit.ph.ticker": "EXM",
      "submit.ph.usefulWork": "WASM fuzz · storage proof · …",
      "submit.ph.algorithm": "HTTP pool · KawPow · …",
      "submit.ph.url": "https://",
      "submit.ph.metricsApi": "https://example.com/api/metrics",
      "submit.ph.github": "https://github.com/…",
      "submit.ph.summary": "2–3 sentences: utility, stage, why it belongs in useful-PoW index.",
      "footer.hackmeDetail": "HackMe detail",
      "footer.submit": "Submit",
      "footer.mpsIdeas": "mining-pool-stats (ideas)",
      "ex.meta.coins": "Coins",
      "ex.meta.pairs": "Pairs",
      "ex.meta.api": "API",
      "ex.link.website": "Website",
      "ex.link.listingHub": "Listing hub",
      "detail.liveMetrics": "Live metrics",
      "detail.reviewChecklist": "Review checklist",
      "detail.reviewNote":
        "Manual curation — automated stats do not imply endorsement or investment advice.",
      "detail.payout": "Total payout (session)",
      "detail.coordinator": "Coordinator",
      "detail.listingHub": "Listing & transparency",
      "detail.listingIntro": "Exchange readiness, memo, and integration pack — HackMe listing hub pattern.",
      "detail.openListingHub": "Open listing hub",
      "detail.hashrateBreakdown": "Hashrate breakdown",
      "detail.breakdownIntro": "Network vs indexed pool coordinator (mining-pool-stats pattern).",
      "detail.poolCompare": "Pool comparison",
      "detail.exchangeListings": "Exchange listings",
      "detail.networkLanes": "Network lanes",
      "detail.economics": "Economics snapshot",
      "detail.tags": "Tags",
      "detail.usefulType": "Useful type",
      "detail.blockReward": "Block reward",
      "detail.difficulty": "Difficulty",
      "detail.verified": "Verified",
      "detail.lastRefresh": "Last refresh",
      "detail.poolCoordinator": "Pool coordinator",
      "detail.indexedWork": "Indexed useful work",
      "detail.soloUnknown": "Solo / unknown",
      "detail.notTracked": "Not tracked on public hub",
      "detail.poolHashrate": "Pool Hashrate",
      "detail.indexedGh": "Indexed useful work",
      "detail.miningPools": "Mining Pools",
      "detail.blockHeight": "Block height",
      "detail.apiStatus": "API status",
      "detail.algorithm": "Algorithm",
      "detail.pendingReview": "pending review",
      "detail.workersCount": "{n} workers",
      "detail.openLane": "Open →",
      "filter.tagsAria": "Filter by tag",
      "ex.link.allExchanges": "All exchanges →",
      "check.usefulWork": "Useful work documented",
      "check.publicMetrics": "Public metrics API",
      "check.minerPath": "Miner onboarding path",
      "check.honestScope": "Honest scope statement",
      "profile.email": "Email",
      "profile.name": "Name",
      "profile.role": "Role",
      "title.index": "HackMe · Useful PoW Index — curated useful mining registry",
      "title.exchanges": "Exchanges · HackMe Useful PoW",
      "title.project": "Project · HackMe Useful PoW",
      "title.login": "Developer Login · HackMe Useful PoW",
      "title.dashboard": "Developer Dashboard · HackMe Useful PoW",
      "title.notFound": "Project not found · HackMe Useful PoW",
      "title.verified": "Get verified · HackMe Useful PoW",
      "title.compare": "Compare · HackMe Useful PoW",
      "title.docs": "Registry docs · HackMe Useful PoW",
      "title.status": "Status · HackMe Useful PoW",
      "spark.label": "Local history",
      "spark.localHint": "Hashrate samples stored in this browser only",
      "spark.needHistory": "Need 2+ samples — wait for refresh",
      "verified.eyebrow": "Adapter contract",
      "verified.title": "Get verified",
      "verified.body":
        "Public metrics, documented useful work, honest scope. Manual review — not open signup.",
      "verified.checklistTitle": "Verification checklist",
      "verified.note": "Stats do not imply endorsement or investment advice.",
      "verified.contractTitle": "Expected metrics shape",
      "verified.contractIntro":
        "GET JSON, CORS-friendly or same-origin. Index polls ~every 30s. Prefer nested HackMe-style or flat fields below.",
      "verified.altFields": "Also accepted: hashrate / hashrate_gh / workers / height at top level.",
      "verified.validatorTitle": "Metrics API validator",
      "verified.validatorIntro":
        "Paste a public GET URL. Runs in your browser — CORS must allow this origin (localhost proxy works for HackMe).",
      "verified.urlLabel": "Metrics URL",
      "verified.urlPh": "https://example.com/api/metrics",
      "verified.run": "Validate",
      "verified.tryHackme": "Try HackMe (proxy)",
      "verified.nextTitle": "Ready to submit?",
      "verified.nextBody": "Generate a JSON bundle for manual review — no wallet, no escrow.",
      "verified.fieldJson": "Valid JSON response",
      "verified.fieldHashrate": "Hashrate field",
      "verified.fieldWorkers": "Workers / miners field",
      "verified.fieldHeight": "Height / tip field",
      "verified.fieldOk": "ok / health flag",
      "compare.eyebrow": "Side-by-side",
      "compare.title": "Compare projects",
      "compare.body": "Up to three listings — type, live stats, pools.",
      "compare.slot": "Slot {n}",
      "compare.run": "Refresh stats",
      "compare.clear": "Clear",
      "compare.empty": "Select projects above to compare.",
      "docs.eyebrow": "For integrators",
      "docs.title": "Registry & embed",
      "docs.body": "Consume the curated JSON registry or show a status badge on your project site.",
      "docs.registryTitle": "Registry API",
      "docs.registryIntro":
        "Static JSON — no auth. Cache with ETag / short TTL. schema_version bumps when fields change.",
      "docs.badgeTitle": "Embed badge",
      "docs.badgeIntro": "Link to your listing. Live preview uses registry status for the selected project id.",
      "docs.badgeProject": "Project id",
      "docs.badgeSnippet": "Snippet",
      "docs.policyTitle": "Policy",
      "docs.policy1": "Read-only public APIs only — no wallets, no escrow in this module.",
      "docs.policy2": "Verified ≠ investment advice. Manual curation can reject marketing-only “useful” claims.",
      "docs.policy3": "Listings stay in the index only while useful work stays reviewable.",
      "docs.openBadge": "Open badge page",
      "docs.copySnippet": "Copy snippet",
      "ex.changelogTitle": "Listing changelog",
      "ex.changelogSub": "Honest timeline — planned → paper → live. Not a price ticker.",
      "ex.changelogEmpty": "No changelog entries yet.",
      "ex.table.date": "Date",
      "home.toolsTitle": "Ecosystem tools",
      "home.toolsSub": "Verify adapters, compare listings, embed badges — handoff-ready modules.",
      "watch.add": "Watch",
      "watch.remove": "Unwatch",
      "dash.watchlist": "My watchlist",
      "dash.watchlistSub": "Stars saved in this browser — works without login.",
      "dash.noWatchlist": "No starred projects yet.",
      "dash.stat.watchlist": "Watchlist",
      "status.eyebrow": "Read-only probes",
      "status.title": "Ecosystem status",
      "status.body":
        "Registry files and live adapter health. Not a trading status page — operational visibility for the index.",
      "status.updated": "Last probe {ago}",
      "status.refresh": "Re-run probes",
      "status.probesTitle": "Probes",
      "status.adaptersTitle": "Project adapters",
      "status.col.name": "Component",
      "status.col.detail": "Detail",
      "status.col.latency": "Latency",
      "status.kpi.probes": "Probes OK",
      "status.kpi.adapters": "Live adapters",
      "status.probe.health": "Dev healthz",
      "status.probe.projects": "projects.json",
      "status.probe.exchanges": "exchanges.json",
      "status.probe.hackmeMetrics": "HackMe metrics proxy",
      "status.probe.hackmeWork": "HackMe work-stats proxy",
    },
  };

  let lang = DEFAULT_LANG;

  function loadLang() {
    lang = "en";
    try { localStorage.setItem(STORAGE_KEY, "en"); } catch (_) {}
    document.documentElement.lang = "en";
  }


  function interpolate(text, vars) {
    if (!vars) return text;
    return String(text).replace(/\{(\w+)\}/g, (_, key) =>
      vars[key] != null ? String(vars[key]) : `{${key}}`
    );
  }

  function t(key, vars) {
    const bucket = STRINGS[lang] || STRINGS.en;
    const fallback = STRINGS.en[key];
    const raw = bucket[key] != null ? bucket[key] : fallback != null ? fallback : key;
    return interpolate(raw, vars);
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.closest("[data-i18n-skip]")) return;
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", t(key));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", t(key));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });
    scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (key) el.innerHTML = t(key);
    });
    scope.querySelectorAll("option[data-i18n]").forEach((opt) => {
      const key = opt.getAttribute("data-i18n");
      if (key) opt.textContent = t(key);
    });
    updateDocumentTitle();
  }

  function updateDocumentTitle() {
    const page = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
    const map = {
      "index.html": "title.index",
      "project.html": "title.project",
      "login.html": "title.login",
      "dashboard.html": "title.dashboard",
      "verified.html": "title.verified",
      "compare.html": "title.compare",
      "docs.html": "title.docs",
      "status.html": "title.status",
    };
    const key = map[page];
    if (key && STRINGS[lang][key]) {
      document.title = t(key);
    }
  }

  function setLang(_next) {
    lang = "en";
    try { localStorage.setItem(STORAGE_KEY, "en"); } catch (_) {}
    document.documentElement.lang = "en";
    apply(document);
    window.dispatchEvent(new CustomEvent("usefulpow:langchange", { detail: { lang: "en" } }));
  }


  function getLang() {
    return lang;
  }

  loadLang();

  window.UsefulPowI18n = { t, setLang, getLang, apply, updateDocumentTitle, STRINGS };
})();
