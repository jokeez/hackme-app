(() => {
  "use strict";

  const I18n = window.UsefulPowI18n;
  const Auth = window.UsefulPowAuth;

  function el(tag, cls, html) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function renderLangSwitch() {
    const wrap = el("div", "lang-switch");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", I18n ? I18n.t("lang.label") : "Language");

    ["en", "ru"].forEach((code) => {
      const btn = el("button", "lang-btn");
      btn.type = "button";
      btn.dataset.lang = code;
      btn.textContent = code.toUpperCase();
      btn.setAttribute("aria-pressed", I18n && I18n.getLang() === code ? "true" : "false");
      if (I18n && I18n.getLang() === code) btn.classList.add("active");
      btn.addEventListener("click", () => {
        if (I18n) I18n.setLang(code);
        wrap.querySelectorAll(".lang-btn").forEach((b) => {
          const on = b.dataset.lang === code;
          b.classList.toggle("active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function closeAllDropdowns(except) {
    document.querySelectorAll(".nav-dropdown.open").forEach((d) => {
      if (d !== except) d.classList.remove("open");
    });
    document.querySelectorAll(".nav-more details[open]").forEach((d) => {
      if (d !== except) d.removeAttribute("open");
    });
  }

  function renderAccountMenu(session) {
    const dropdown = el("div", "nav-dropdown account-dropdown");
    const toggle = el("button", "nav-account-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");

    const avatar = el("span", "nav-avatar", '<i class="bi bi-person-fill"></i>');
    const nameSpan = el("span", "nav-account-name notranslate");
    nameSpan.setAttribute("translate", "no");
    nameSpan.textContent = session.displayName || session.email;
    const caret = el("i", "bi bi-chevron-down nav-caret");
    toggle.appendChild(avatar);
    toggle.appendChild(nameSpan);
    toggle.appendChild(caret);

    const menu = el("ul", "dropdown-menu");

    const items = [
      { href: "dashboard.html", icon: "bi-speedometer2", key: "nav.dashboard" },
      { href: "index.html#listings", icon: "bi-coin", key: "nav.myCoins" },
      { href: "index.html#live-stats", icon: "bi-hdd-stack", key: "nav.myPools" },
      { href: "dashboard.html#profile", icon: "bi-person-gear", key: "nav.profile" },
      { href: "dashboard.html#submissions", icon: "bi-inbox", key: "nav.mySubmissions" },
    ];

    items.forEach((item) => {
      const li = el("li");
      const a = el("a", "dropdown-item", `<i class="bi ${item.icon}"></i> <span data-i18n="${item.key}"></span>`);
      a.href = item.href;
      li.appendChild(a);
      menu.appendChild(li);
    });

    const divider = el("li", "dropdown-divider");
    menu.appendChild(divider);

    const logoutLi = el("li");
    const logoutBtn = el(
      "button",
      "dropdown-item dropdown-danger",
      `<i class="bi bi-box-arrow-right"></i> <span data-i18n="nav.logout"></span>`
    );
    logoutBtn.type = "button";
    logoutBtn.addEventListener("click", () => {
      Auth.clearSession();
      window.location.href = "index.html";
    });
    logoutLi.appendChild(logoutBtn);
    menu.appendChild(logoutLi);

    toggle.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const open = dropdown.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      closeAllDropdowns(open ? dropdown : null);
    });

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);
    return dropdown;
  }

  function renderGuestMenu() {
    const wrap = el("div", "nav-auth-guest");
    const login = el("a", "nav-link nav-login", `<i class="bi bi-box-arrow-in-right"></i> <span data-i18n="nav.login"></span>`);
    login.href = "login.html";
    wrap.appendChild(login);
    return wrap;
  }

  function mountNavbarTools() {
    const host = document.getElementById("navbar-tools");
    if (!host) return;

    host.innerHTML = "";
    host.appendChild(renderLangSwitch());

    const session = Auth && Auth.readSession();
    if (session) {
      host.appendChild(renderAccountMenu(session));
    } else {
      host.appendChild(renderGuestMenu());
    }

    if (I18n) I18n.apply(host);
    if (window.UsefulPowWow && window.UsefulPowWow.mountCmdButton) {
      window.UsefulPowWow.mountCmdButton();
    }
  }

  function wireMoreMenu() {
    document.querySelectorAll(".nav-more details").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (details.open) closeAllDropdowns(details);
      });
      details.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => details.removeAttribute("open"));
      });
    });
  }

  function refresh() {
    mountNavbarTools();
    if (I18n) I18n.apply(document);
    if (window.UsefulPowLayout && window.UsefulPowLayout.setActiveNav) {
      window.UsefulPowLayout.setActiveNav();
    }
  }

  function init() {
    mountNavbarTools();
    wireMoreMenu();

    document.addEventListener("click", (ev) => {
      if (ev.target.closest(".nav-more")) return;
      closeAllDropdowns(null);
    });
    window.addEventListener("usefulpow:authchange", refresh);
    window.addEventListener("usefulpow:langchange", () => {
      mountNavbarTools();
      if (I18n) I18n.apply(document);
    });

    if (I18n) I18n.apply(document);
    if (window.UsefulPowLayout && window.UsefulPowLayout.setActiveNav) {
      window.UsefulPowLayout.setActiveNav();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.UsefulPowShell = { refresh };
})();
