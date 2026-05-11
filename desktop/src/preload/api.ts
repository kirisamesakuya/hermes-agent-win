import { ipcRenderer } from "electron";
import type { AppLocale, DesktopApi, InstallEvent, WebuiStatus } from "../types.js";

export function createDesktopApi(): DesktopApi {
  return {
    getStatus: () => ipcRenderer.invoke("hermes:get-status"),
    installHermes: () => ipcRenderer.invoke("hermes:install"),
    restartWebui: () => ipcRenderer.invoke("hermes:restart-webui"),
    pickWorkspace: () => ipcRenderer.invoke("hermes:pick-workspace"),
    tailLogs: (lines?: number) => ipcRenderer.invoke("hermes:tail-logs", lines),
    openPath: (target) => ipcRenderer.invoke("hermes:open-path", target),
    getLocale: () => ipcRenderer.invoke("hermes:get-locale"),
    setLocale: (locale: AppLocale) => ipcRenderer.invoke("hermes:set-locale", locale),
    onLocaleChanged: (handler) => {
      const listener = (_: Electron.IpcRendererEvent, locale: AppLocale) => handler(locale);
      ipcRenderer.on("hermes-locale-changed", listener);
      return () => ipcRenderer.off("hermes-locale-changed", listener);
    },
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
}
