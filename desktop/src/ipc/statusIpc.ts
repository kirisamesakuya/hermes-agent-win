import { ipcMain } from "electron";
import { collectDiagnostics } from "../diagnostics/collectDiagnostics.js";
import type { IpcContext } from "./types.js";

export function registerStatusIpc({ webui }: IpcContext): void {
  ipcMain.handle("hermes:get-status", async () => collectDiagnostics(webui));
}
