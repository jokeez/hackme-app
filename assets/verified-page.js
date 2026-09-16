(() => {
  "use strict";

  const Core = window.UsefulPowCore;
  if (!Core) return;

  let lastResult = null;

  function $(id) {
    return document.getElementById(id);
  }

  function t(key, vars) {
    const I18n = window.UsefulPowI18n;
    return I18n ? I18n.t(key, vars) : key;
  }

  function fieldRow(label, ok) {
    return `<li class="check-item ${ok ? "ok" : "pending"}">${Core.escapeHtml(label)}</li>`;
  }

  function renderResult(result) {
    const host = $("validator-result");
    if (!host || !result) return;
    host.hidden = false;
    lastResult = result;

    const fields = result.fields || {};
    const hints = (result.hints || []).map((h) => `<li>${Core.escapeHtml(h)}</li>`).join("");
    const badge = result.ok
      ? '<span class="ex-badge ex-live">PASS</span>'
      : '<span class="ex-badge ex-planned">NEEDS WORK</span>';

    host.innerHTML = `
      <div class="validator-summary">
        ${badge}
        <span class="muted-inline notranslate" translate="no">${Core.escapeHtml(result.url || "")}</span>
      </div>
      <ul class="check-list">
        ${fieldRow(t("verified.fieldJson"), result.json_ok)}
        ${fieldRow(t("verified.fieldHashrate"), !!fields.hashrate)}
        ${fieldRow(t("verified.fieldWorkers"), !!fields.workers)}
        ${fieldRow(t("verified.fieldHeight"), !!fields.height)}
        ${fieldRow(t("verified.fieldOk"), !!fields.ok)}
      </ul>
      ${hints ? `<ul class="validator-hints">${hints}</ul>` : ""}
      ${
        result.sample
          ? `<pre class="output-box notranslate" translate="no">${Core.escapeHtml(
              JSON.stringify(result.sample, null, 2).slice(0, 1200)
            )}</pre>`
          : result.error
            ? `<p class="exchange-caution">${Core.escapeHtml(String(result.error))}</p>`
            : ""
      }
    `;
  }

  async function runValidate(url) {
    const btn = $("btn-validate");
    if (btn) btn.disabled = true;
    const result = await Core.validateMetricsUrl(url);
    renderResult(result);
    if (btn) btn.disabled = false;
  }

  function init() {
    const input = $("metrics-url");
    const btn = $("btn-validate");
    const hackmeBtn = $("btn-validate-hackme");

    if (btn && input) {
      btn.addEventListener("click", () => void runValidate(String(input.value || "").trim()));
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          void runValidate(String(input.value || "").trim());
        }
      });
    }

    if (hackmeBtn) {
      hackmeBtn.addEventListener("click", () => {
        const proxy = `${window.location.origin}/proxy/hackme/metrics`;
        if (input) input.value = proxy;
        void runValidate(proxy);
      });
    }

    window.addEventListener("usefulpow:langchange", () => {
      if (lastResult) renderResult(lastResult);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
