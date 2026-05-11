import { ipcMain } from "electron";
import type { IpcContext } from "./types.js";

export function registerLogsIpc({ logs }: IpcContext): void {
  ipcMain.handle("hermes:tail-logs", async (_event, lines?: number) => logs.tail(lines));
}
