import type { AppLocale } from "../i18n/appLocale.js";
import { t } from "../i18n/strings.js";

export function offlinePageUrl(message: string, locale: AppLocale): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(offlineHtml(message, locale))}`;
}

function offlineHtml(message: string, locale: AppLocale): string {
  const title = t(locale, "offlinePageTitle");
  const heading = t(locale, "offlineHeading");
  const retry = t(locale, "offlineRetry");
  const install = t(locale, "offlineInstall");
  const logs = t(locale, "offlineLogs");
  const restarting = t(locale, "offlineRestarting");
  const startingInstaller = t(locale, "offlineStartingInstaller");
  return `
    <!doctype html>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 14px system-ui, sans-serif; background: #0f172a; color: #e5e7eb; }
      main { width: min(680px, calc(100vw - 40px)); }
      h1 { font-size: 28px; margin: 0 0 12px; }
      p { color: #cbd5e1; }
      button { min-height: 36px; padding: 0 14px; margin-right: 8px; border-radius: 6px; border: 1px solid #475569; background: #111827; color: white; cursor: pointer; }
      pre { white-space: pre-wrap; max-height: 280px; overflow: auto; background: #020617; padding: 12px; border-radius: 8px; }
    </style>
    <main>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(message)}</p>
      <button id="retry">${escapeHtml(retry)}</button>
      <button id="install">${escapeHtml(install)}</button>
      <button id="logs">${escapeHtml(logs)}</button>
      <pre id="out" hidden></pre>
    </main>
    <script>
      const out = document.getElementById('out');
      const restarting = ${JSON.stringify(restarting)};
      const startingInstaller = ${JSON.stringify(startingInstaller)};
      document.getElementById('retry').onclick = async () => {
        out.hidden = false; out.textContent = restarting;
        await window.hermesDesktop.restartWebui();
        location.reload();
      };
      document.getElementById('install').onclick = async () => {
        out.hidden = false; out.textContent = startingInstaller;
        await window.hermesDesktop.installHermes();
      };
      document.getElementById('logs').onclick = async () => {
        out.hidden = false; out.textContent = await window.hermesDesktop.tailLogs(200);
      };
      window.hermesDesktop.onInstallEvent((event) => {
        out.hidden = false; out.textContent += event.message;
      });
    </script>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}
