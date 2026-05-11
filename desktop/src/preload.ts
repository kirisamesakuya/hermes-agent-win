import { contextBridge, ipcRenderer } from "electron";
import { DesktopApi, InstallEvent, WebuiStatus } from "./types.js";

const api: DesktopApi = {
  getStatus: () => ipcRenderer.invoke("hermes:get-status"),
  installHermes: () => ipcRenderer.invoke("hermes:install"),
  restartWebui: () => ipcRenderer.invoke("hermes:restart-webui"),
  pickWorkspace: () => ipcRenderer.invoke("hermes:pick-workspace"),
  tailLogs: (lines?: number) => ipcRenderer.invoke("hermes:tail-logs", lines),
  openPath: (target) => ipcRenderer.invoke("hermes:open-path", target),
  onInstallEvent: (callback) => {
    const listener = (_: Electron.IpcRendererEvent, event: InstallEvent) => callback(event);
    ipcRenderer.on("hermes-install-event", listener);
    return () => ipcRenderer.off("hermes-install-event", listener);
  },
  onWebuiEvent: (callback) => {
    const listener = (_: Electron.IpcRendererEvent, status: WebuiStatus) => callback(status);
    ipcRenderer.on("hermes-webui-event", listener);
    return () => ipcRenderer.off("hermes-webui-event", listener);
  }
};

contextBridge.exposeInMainWorld("hermesDesktop", api);

window.addEventListener("DOMContentLoaded", () => {
  const panel = document.createElement("section");
  panel.id = "hermes-desktop-panel";
  panel.innerHTML = `
    <style>
      #hermes-desktop-panel {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        width: 320px;
        max-width: calc(100vw - 32px);
        font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
        color: #f8fafc;
      }
      #hermes-desktop-panel .hd-card {
        display: none;
        border: 1px solid rgba(148, 163, 184, .35);
        background: rgba(15, 23, 42, .96);
        box-shadow: 0 18px 50px rgba(0,0,0,.35);
        border-radius: 8px;
        overflow: hidden;
      }
      #hermes-desktop-panel[data-open="1"] .hd-card { display: block; }
      #hermes-desktop-panel .hd-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(148, 163, 184, .25);
      }
      #hermes-desktop-panel .hd-body { padding: 12px; }
      #hermes-desktop-panel .hd-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
      }
      #hermes-desktop-panel button {
        min-height: 32px;
        border: 1px solid rgba(148, 163, 184, .35);
        border-radius: 6px;
        background: #111827;
        color: #f8fafc;
        cursor: pointer;
      }
      #hermes-desktop-panel button:hover { background: #1f2937; }
      #hermes-desktop-panel .hd-fab {
        float: right;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: #0f172a;
      }
      #hermes-desktop-panel pre {
        max-height: 180px;
        overflow: auto;
        white-space: pre-wrap;
        margin: 10px 0 0;
        padding: 8px;
        border-radius: 6px;
        background: #020617;
        color: #cbd5e1;
      }
    </style>
    <div class="hd-card">
      <div class="hd-head">
        <strong>Hermes Desktop</strong>
        <button data-hd-close title="Close">x</button>
      </div>
      <div class="hd-body">
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
    <button class="hd-fab" data-hd-open title="Hermes Desktop">H</button>
  `;
  document.body.appendChild(panel);

  const statusNode = panel.querySelector("[data-hd-status]") as HTMLElement;
  const logNode = panel.querySelector("[data-hd-log]") as HTMLPreElement;
  const render = async () => {
    const status = await api.getStatus();
    statusNode.textContent = [
      `Hermes: ${status.hermes.installed ? "installed" : "not found"}`,
      `WebUI: ${status.webui.running ? "running" : status.webui.starting ? "starting" : "stopped"}`,
      status.webui.url ? `URL: ${status.webui.url}` : ""
    ].filter(Boolean).join("\n");
  };

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
  void render();
});

declare global {
  interface Window {
    hermesDesktop: DesktopApi;
  }
}
