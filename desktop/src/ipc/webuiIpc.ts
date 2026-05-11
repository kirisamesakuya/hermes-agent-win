import { ipcMain } from "electron";
import { restartWebuiAndLoad } from "../webui/loadWebui.js";
import type { IpcContext } from "./types.js";

export function registerWebuiIpc({ getMainWindow, webui }: IpcContext): void {
  ipcMain.handle("hermes:restart-webui", async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return webui.restart();
    return restartWebuiAndLoad(webui, mainWindow);
  });
}
