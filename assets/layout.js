(() => {
  "use strict";

  function currentPage() {
    const p = (window.location.pathname.split("/").pop() || "index.html").split("?")[0];
    return p || "index.html";
  }

  function setActiveNav() {
    const page = currentPage();
    const hash = window.location.hash;

    document.querySelectorAll("[data-nav-page]").forEach((el) => {
      const target = el.getAttribute("data-nav-page") || "";
      let active = false;

      if (page === "index.html" && target.startsWith("#")) {
        active = hash === target;
      } else if (page === "index.html" && target === "index.html") {
        active = !hash || hash === "#overview" || hash === "#lanes";
      } else {
        active = target === page;
      }

      el.classList.toggle("active", active);
    });
  }

  function wireMobileNav() {
    const toggle = document.getElementById("nav-toggle");
    const collapse = document.getElementById("navbar-nav");
    if (!toggle || !collapse) return;

    toggle.addEventListener("click", () => {
      collapse.classList.toggle("show");
    });

    collapse.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => collapse.classList.remove("show"));
    });
  }

  function wireSmoothScroll() {
    document.querySelectorAll("[data-scroll]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        const href = el.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        ev.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", href);
        setActiveNav();
      });
    });
    window.addEventListener("hashchange", setActiveNav);
  }

  function initLayout() {
    setActiveNav();
    wireMobileNav();
    wireSmoothScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayout);
  } else {
    initLayout();
  }

  window.UsefulPowLayout = { setActiveNav };
})();
