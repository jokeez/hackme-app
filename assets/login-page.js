(() => {
  "use strict";

  const Auth = window.UsefulPowAuth;
  const I18n = window.UsefulPowI18n;

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(text, ok) {
    const el = $("login-message");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("hidden", "auth-ok", "auth-err");
    el.classList.add(ok ? "auth-ok" : "auth-err");
  }

  function redirectIfLoggedIn() {
    if (Auth && Auth.isLoggedIn()) {
      window.location.replace("dashboard.html");
    }
  }

  function init() {
    redirectIfLoggedIn();

    const form = $("login-form");
    const demoBtn = $("btn-demo-login");

    if (demoBtn) {
      demoBtn.addEventListener("click", () => {
        Auth.demoLogin();
        showMessage(I18n ? I18n.t("login.success") : "Signed in", true);
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 400);
      });
    }

    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const email = ($("login-email") && $("login-email").value) || "";
        const password = ($("login-password") && $("login-password").value) || "";
        if (!Auth.login(email, password)) {
          showMessage(I18n ? I18n.t("login.error") : "Login failed", false);
          return;
        }
        showMessage(I18n ? I18n.t("login.success") : "Signed in", true);
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 400);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
