(() => {
  "use strict";

  const SESSION_KEY = "useful-pow.session.v1";
  const SUBMISSIONS_KEY = "useful-pow.submissions.v1";
  const WATCHLIST_KEY = "useful-pow.watchlist.v1";

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.email) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function writeSession(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        role: user.role || "developer",
        signedInAt: Date.now(),
      })
    );
    window.dispatchEvent(new CustomEvent("usefulpow:authchange"));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent("usefulpow:authchange"));
  }

  function isLoggedIn() {
    return !!readSession();
  }

  function demoLogin() {
    writeSession({
      email: "developer@useful-pow.local",
      displayName: "Developer",
      role: "developer",
    });
  }

  function login(email, password) {
    const e = String(email || "").trim();
    const p = String(password || "").trim();
    if (!e || !p) return false;
    writeSession({
      email: e,
      displayName: e.split("@")[0] || "Developer",
      role: "developer",
    });
    return true;
  }

  function readSubmissions() {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveSubmission(payload) {
    const list = readSubmissions();
    list.unshift({
      id: `sub-${Date.now()}`,
      saved_at: new Date().toISOString(),
      status: "draft",
      payload,
    });
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list.slice(0, 20)));
    return list[0];
  }

  function readWatchlist() {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list.map(String) : [];
    } catch (_) {
      return [];
    }
  }

  function writeWatchlist(ids) {
    const uniq = [...new Set((ids || []).map(String))].slice(0, 50);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(uniq));
    window.dispatchEvent(new CustomEvent("usefulpow:watchchange", { detail: { ids: uniq } }));
    return uniq;
  }

  function isWatched(projectId) {
    return readWatchlist().includes(String(projectId));
  }

  function toggleWatch(projectId) {
    const id = String(projectId || "").trim();
    if (!id) return false;
    const list = readWatchlist();
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(id);
    writeWatchlist(list);
    return list.includes(id);
  }

  window.UsefulPowAuth = {
    readSession,
    writeSession,
    clearSession,
    isLoggedIn,
    demoLogin,
    login,
    readSubmissions,
    saveSubmission,
    readWatchlist,
    writeWatchlist,
    isWatched,
    toggleWatch,
  };
})();
