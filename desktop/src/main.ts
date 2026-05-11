import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell, Tray, type OpenDialogOptions } from "electron";
import { agentReferenceRoot, appRoot, hermesHomePath, logPath, webuiRoot } from "./paths.js";
import { LogBuffer } from "./logBuffer.js";
import { getHermesStatus } from "./probes.js";
import { registerInstallerIpc } from "./installer.js";
import { WebuiService } from "./webuiService.js";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const logs = new LogBuffer(logPath());
const webui = new WebuiService(logs);

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 980,
    minHeight: 680,
    title: "Hermes Desktop",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once("ready-to-show", () => win.show());
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
  mainWindow = win;
  return win;
}

async function loadWebui(win: BrowserWindow): Promise<void> {
  const status = await webui.start();
  if (status.running && status.url) {
    await win.loadURL(status.url);
    return;
  }

  const message = encodeURIComponent(status.lastError || "Hermes WebUI failed to start.");
  await win.loadURL(`data:text/html;charset=utf-8,${offlineHtml(message)}`);
}

function offlineHtml(encodedMessage: string): string {
  return `
    <!doctype html>
    <meta charset="utf-8">
    <title>Hermes Desktop</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 14px system-ui, sans-serif; background: #0f172a; color: #e5e7eb; }
      main { width: min(680px, calc(100vw - 40px)); }
      h1 { font-size: 28px; margin: 0 0 12px; }
      p { color: #cbd5e1; }
      button { min-height: 36px; padding: 0 14px; margin-right: 8px; border-radius: 6px; border: 1px solid #475569; background: #111827; color: white; cursor: pointer; }
      pre { white-space: pre-wrap; max-height: 280px; overflow: auto; background: #020617; padding: 12px; border-radius: 8px; }
    </style>
    <main>
      <h1>Hermes WebUI did not start</h1>
      <p>${decodeURIComponent(encodedMessage)}</p>
      <button id="retry">Restart WebUI</button>
      <button id="install">Install Hermes</button>
      <button id="logs">Show Logs</button>
      <pre id="out" hidden></pre>
    </main>
    <script>
      const out = document.getElementById('out');
      document.getElementById('retry').onclick = async () => {
        out.hidden = false; out.textContent = 'Restarting...';
        await window.hermesDesktop.restartWebui();
        location.reload();
      };
      document.getElementById('install').onclick = async () => {
        out.hidden = false; out.textContent = 'Starting installer...\\n';
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

function registerIpc(): void {
  ipcMain.handle("hermes:get-status", async () => ({
    hermes: await getHermesStatus(),
    webui: webui.status(),
    paths: {
      appRoot: appRoot(),
      webuiRoot: webuiRoot(),
      agentReferenceRoot: agentReferenceRoot(),
      logPath: logPath()
    }
  }));

  ipcMain.handle("hermes:restart-webui", async () => {
    const status = await webui.restart();
    if (mainWindow && status.running && status.url) {
      await mainWindow.loadURL(status.url);
    }
    return status;
  });

  ipcMain.handle("hermes:tail-logs", async (_event, lines?: number) => logs.tail(lines));

  ipcMain.handle("hermes:pick-workspace", async () => {
    const dialogOptions: OpenDialogOptions = {
      title: "Choose Hermes workspace",
      properties: ["openDirectory", "createDirectory"]
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    if (result.canceled || !result.filePaths[0]) return { canceled: true, path: null };
    const chosen = result.filePaths[0];
    const status = webui.status();
    if (status.url) {
      try {
        await fetch(`${status.url}/api/desktop/workspace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace: chosen })
        });
      } catch (error) {
        logs.append(`[desktop] failed to sync workspace: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
    return { canceled: false, path: chosen };
  });

  ipcMain.handle("hermes:open-path", async (_event, target: string) => {
    const resolved =
      target === "logs" ? path.dirname(logPath()) :
      target === "hermesHome" ? hermesHomePath() :
      target === "webuiRoot" ? webuiRoot() :
      target;
    const error = await shell.openPath(resolved);
    return error ? { ok: false, error } : { ok: true };
  });

  registerInstallerIpc(logs);
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Hermes",
      submenu: [
        { label: "Restart WebUI", click: () => void webui.restart() },
        { label: "Open Logs", click: () => void shell.openPath(path.dirname(logPath())) },
        { label: "Open Hermes Home", click: () => void shell.openPath(hermesHomePath()) },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    { role: "editMenu" },
    { role: "viewMenu" }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Hermes Desktop");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Show Hermes", click: () => mainWindow?.show() },
    { label: "Restart WebUI", click: () => void webui.restart() },
    { label: "Open Logs", click: () => void shell.openPath(path.dirname(logPath())) },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]));
}

app.whenReady().then(async () => {
  registerIpc();
  createMenu();
  createTray();
  const win = createWindow();
  await loadWebui(win);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const win = createWindow();
    void loadWebui(win);
  }
});

app.on("before-quit", () => {
  void webui.stop();
});
