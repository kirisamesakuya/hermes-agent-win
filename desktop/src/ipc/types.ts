import type { BrowserWindow } from "electron";
import type { LogBuffer } from "../logBuffer.js";
import type { WebuiService } from "../webuiService.js";

export type IpcContext = {
  getMainWindow: () => BrowserWindow | null;
  logs: LogBuffer;
  webui: WebuiService;
};
