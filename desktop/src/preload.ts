import { contextBridge } from "electron";
import type { DesktopApi } from "./types.js";
import { createDesktopApi } from "./preload/api.js";
import { injectDesktopPanel } from "./preload/desktopPanel.js";

const api = createDesktopApi();

contextBridge.exposeInMainWorld("hermesDesktop", api);

window.addEventListener("DOMContentLoaded", () => {
  injectDesktopPanel(api);
});

declare global {
  interface Window {
    hermesDesktop: DesktopApi;
  }
}
