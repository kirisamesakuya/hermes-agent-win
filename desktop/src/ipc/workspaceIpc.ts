import { dialog, ipcMain, type OpenDialogOptions } from "electron";
import { getAppLocale } from "../i18n/localeRuntime.js";
import { t } from "../i18n/strings.js";
import type { IpcContext } from "./types.js";

export function registerWorkspaceIpc({ getMainWindow, logs, webui }: IpcContext): void {
  ipcMain.handle("hermes:pick-workspace", async () => {
    const locale = getAppLocale();
    const dialogOptions: OpenDialogOptions = {
      title: t(locale, "dialogWorkspaceTitle"),
      properties: ["openDirectory", "createDirectory"]
    };
    const mainWindow = getMainWindow();
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
}
