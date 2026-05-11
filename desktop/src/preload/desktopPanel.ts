import type { AppLocale, DesktopApi } from "../types.js";
import { t } from "../i18n/strings.js";
import { desktopPanelStyles } from "./panelStyles.js";

export function injectDesktopPanel(api: DesktopApi): void {
  const panel = document.createElement("section");
  panel.id = "hermes-desktop-panel";
  panel.innerHTML = `
    <style>${desktopPanelStyles}</style>
    <div class="hd-card">
      <div class="hd-head">
        <strong data-hd-title>Hermes Desktop</strong>
        <button data-hd-close title="Close">x</button>
      </div>
      <div class="hd-body">
        <div class="hd-lang">
          <span data-hd-lang-label>Language</span>
          <select data-hd-locale aria-label="Language">
            <option value="zh">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div data-hd-status>Loading status...</div>
        <div class="hd-actions">
          <button data-hd-workspace>Workspace</button>
          <button data-hd-restart>Restart</button>
          <button data-hd-install>Install Hermes</button>
          <button data-hd-logs>Logs</button>
        </div>
        <pre data-hd-log hidden></pre>
      </div>
    </div>
    <button class="hd-fab" data-hd-open title="Hermes Desktop" type="button">H</button>
  `;
  document.body.appendChild(panel);

  const statusNode = panel.querySelector("[data-hd-status]") as HTMLElement;
  const logNode = panel.querySelector("[data-hd-log]") as HTMLPreElement;
  const localeSelect = panel.querySelector("[data-hd-locale]") as HTMLSelectElement;
  const langLabel = panel.querySelector("[data-hd-lang-label]") as HTMLElement;
  const titleStrong = panel.querySelector("[data-hd-title]") as HTMLElement;
  const closeBtn = panel.querySelector("[data-hd-close]") as HTMLButtonElement;
  const fabBtn = panel.querySelector("[data-hd-open]") as HTMLButtonElement;
  const workspaceBtn = panel.querySelector("[data-hd-workspace]") as HTMLButtonElement;
  const restartBtn = panel.querySelector("[data-hd-restart]") as HTMLButtonElement;
  const installBtn = panel.querySelector("[data-hd-install]") as HTMLButtonElement;
  const logsBtn = panel.querySelector("[data-hd-logs]") as HTMLButtonElement;

  let locale: AppLocale = "zh";

  const applyChrome = () => {
    titleStrong.textContent = t(locale, "panelTitle");
    closeBtn.title = t(locale, "panelCloseTitle");
    fabBtn.title = t(locale, "panelFabTitle");
    langLabel.textContent = t(locale, "panelLanguage");
    localeSelect.value = locale;
    localeSelect.setAttribute("aria-label", t(locale, "panelLanguage"));
    workspaceBtn.textContent = t(locale, "panelWorkspace");
    restartBtn.textContent = t(locale, "panelRestart");
    installBtn.textContent = t(locale, "panelInstall");
    logsBtn.textContent = t(locale, "panelLogs");
  };

  const render = async () => {
    statusNode.textContent = t(locale, "panelLoading");
    const status = await api.getStatus();
    statusNode.textContent = [
      `${t(locale, "panelHermesLabel")}: ${status.hermes.installed ? t(locale, "panelHermesInstalled") : t(locale, "panelHermesNotFound")}`,
      `${t(locale, "panelWebuiLabel")}: ${
        status.webui.running
          ? t(locale, "panelWebuiRunning")
          : status.webui.starting
            ? t(locale, "panelWebuiStarting")
            : t(locale, "panelWebuiStopped")
      }`,
      status.webui.url ? `${t(locale, "panelUrlPrefix")}: ${status.webui.url}` : ""
    ].filter(Boolean).join("\n");
  };

  void api.getLocale().then((next) => {
    locale = next;
    applyChrome();
    void render();
  });

  api.onLocaleChanged((next) => {
    locale = next;
    applyChrome();
    void render();
  });

  localeSelect.addEventListener("change", () => {
    const next = localeSelect.value === "en" ? "en" : "zh";
    void api.setLocale(next);
  });

  panel.querySelector("[data-hd-open]")?.addEventListener("click", () => {
    panel.dataset.open = panel.dataset.open === "1" ? "0" : "1";
    void render();
  });
  panel.querySelector("[data-hd-close]")?.addEventListener("click", () => {
    panel.dataset.open = "0";
  });
  panel.querySelector("[data-hd-workspace]")?.addEventListener("click", async () => {
    await api.pickWorkspace();
    await render();
  });
  panel.querySelector("[data-hd-restart]")?.addEventListener("click", async () => {
    await api.restartWebui();
    await render();
  });
  panel.querySelector("[data-hd-install]")?.addEventListener("click", async () => {
    await api.installHermes();
  });
  panel.querySelector("[data-hd-logs]")?.addEventListener("click", async () => {
    logNode.hidden = !logNode.hidden;
    if (!logNode.hidden) logNode.textContent = await api.tailLogs(120);
  });
  api.onWebuiEvent(() => void render());
  api.onInstallEvent((event) => {
    logNode.hidden = false;
    logNode.textContent = `${logNode.textContent || ""}${event.message}`;
  });
}
