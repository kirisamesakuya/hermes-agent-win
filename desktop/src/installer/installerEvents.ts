import { BrowserWindow } from "electron";
import type { InstallEvent } from "../types.js";

export function broadcastInstallEvent(event: InstallEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("hermes-install-event", event);
  }
}
