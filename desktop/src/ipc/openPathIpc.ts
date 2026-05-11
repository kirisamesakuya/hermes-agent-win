import path from "node:path";
import { ipcMain, shell } from "electron";
import { hermesHomePath, logPath, webuiRoot } from "../paths.js";
import type { OpenPathTarget } from "../types.js";

export function registerOpenPathIpc(): void {
  ipcMain.handle("hermes:open-path", async (_event, target: OpenPathTarget) => {
    const resolved = resolveOpenPathTarget(target);
    if (!resolved) return { ok: false, error: `Unsupported path target: ${String(target)}` };
    const error = await shell.openPath(resolved);
    return error ? { ok: false, error } : { ok: true };
  });
}

function resolveOpenPathTarget(target: OpenPathTarget): string | null {
  switch (target) {
    case "logs":
      return path.dirname(logPath());
    case "hermesHome":
      return hermesHomePath();
    case "webuiRoot":
      return webuiRoot();
    default:
      return null;
  }
}
