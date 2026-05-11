import { ipcMain } from "electron";
import { spawn } from "node:child_process";
import { getAppLocale } from "../i18n/localeRuntime.js";
import { t } from "../i18n/strings.js";
import type { LogBuffer } from "../logBuffer.js";
import { broadcastInstallEvent } from "./installerEvents.js";

const INSTALL_COMMAND =
  "irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex";

let installing = false;

export function registerInstallerIpc(logs: LogBuffer): void {
  ipcMain.handle("hermes:install", async () => {
    if (installing) return { started: false };
    installing = true;
    const locale = getAppLocale();
    broadcastInstallEvent({ type: "start", message: t(locale, "installerStarting") });
    logs.append("\n[installer] Starting Hermes Windows installer\n");

    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", INSTALL_COMMAND],
      { windowsHide: true }
    );

    child.stdout.on("data", (chunk: Buffer) => {
      const message = chunk.toString();
      logs.append(message);
      broadcastInstallEvent({ type: "stdout", message });
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const message = chunk.toString();
      logs.append(message);
      broadcastInstallEvent({ type: "stderr", message });
    });

    child.on("error", (error) => {
      installing = false;
      logs.append(`[installer] ${error.message}\n`);
      broadcastInstallEvent({ type: "error", message: error.message });
    });

    child.on("exit", (code) => {
      installing = false;
      logs.append(`[installer] exited with ${code}\n`);
      broadcastInstallEvent({
        type: "exit",
        message: t(getAppLocale(), "installerExit", { code: String(code ?? "") }),
        code
      });
    });

    return { started: true };
  });
}
