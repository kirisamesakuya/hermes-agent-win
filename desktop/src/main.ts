import { app, BrowserWindow, Tray } from "electron";
import { createMenu } from "./app/menu.js";
import { createTray } from "./app/tray.js";
import { createWindow } from "./app/createWindow.js";
import type { AppLocale } from "./i18n/appLocale.js";
import { getAppLocale, setAppLocale } from "./i18n/localeRuntime.js";
import { t } from "./i18n/strings.js";
import { registerIpc } from "./ipc/registerIpc.js";
import { registerLocaleIpc } from "./ipc/localeIpc.js";
import { LogBuffer } from "./logBuffer.js";
import { logPath } from "./paths.js";
import { restartWebuiAndLoad, startWebuiAndLoad } from "./webui/loadWebui.js";
import { WebuiService } from "./webuiService.js";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const logs = new LogBuffer(logPath());
const webui = new WebuiService(logs);

async function restartWebuiAndReload(): Promise<void> {
  if (!mainWindow) return;
  await restartWebuiAndLoad(webui, mainWindow);
  mainWindow.show();
  mainWindow.focus();
}

function rebuildShellUi(): void {
  const locale = getAppLocale();
  createMenu({
    locale,
    onRestartWebui: () => void restartWebuiAndReload(),
    onSelectLocale: applyLocale
  });
  tray?.destroy();
  tray = createTray({
    locale,
    getMainWindow: () => mainWindow,
    onRestartWebui: () => void restartWebuiAndReload(),
    onSelectLocale: applyLocale
  });
}

function applyLocale(next: AppLocale): void {
  setAppLocale(next);
  rebuildShellUi();
  mainWindow?.setTitle(t(next, "windowTitle"));
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send("hermes-locale-changed", next);
  }
  syncWebuiLangFromDesktopShell(mainWindow);
}

/** Align embedded Hermes WebUI (localStorage + i18n) with the desktop shell locale. */
function syncWebuiLangFromDesktopShell(win: BrowserWindow | null): void {
  if (!win || win.isDestroyed()) return;
  const code = getAppLocale() === "en" ? "en" : "zh";
  const q = JSON.stringify(code);
  const script = `(()=>{try{localStorage.setItem("hermes-lang",${q});if(typeof setLocale==="function")setLocale(${q});if(typeof applyLocaleToDOM==="function")applyLocaleToDOM();}catch(_){}})()`;
  void win.webContents.executeJavaScript(script, true);
}

function attachWebuiLocaleSync(win: BrowserWindow): void {
  win.webContents.on("did-finish-load", () => {
    setTimeout(() => syncWebuiLangFromDesktopShell(win), 400);
  });
}

function openMainWindow(): BrowserWindow {
  const win = createWindow({
    title: t(getAppLocale(), "windowTitle"),
    shouldQuitOnClose: () => isQuitting,
    onClosed: (closedWindow) => {
      if (mainWindow === closedWindow) mainWindow = null;
    }
  });
  attachWebuiLocaleSync(win);
  mainWindow = win;
  return win;
}

app.whenReady().then(async () => {
  void getAppLocale();
  registerIpc({ getMainWindow: () => mainWindow, logs, webui });
  registerLocaleIpc(applyLocale);
  rebuildShellUi();
  const win = openMainWindow();
  await startWebuiAndLoad(webui, win);
});

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
    return;
  }
  if (BrowserWindow.getAllWindows().length === 0) {
    const win = openMainWindow();
    void startWebuiAndLoad(webui, win);
  }
});

app.on("window-all-closed", () => {
  if (isQuitting) return;
});

app.on("before-quit", () => {
  isQuitting = true;
  void webui.stop();
  tray?.destroy();
  tray = null;
});
