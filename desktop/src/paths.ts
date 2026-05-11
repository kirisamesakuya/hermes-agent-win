import path from "node:path";
import { app } from "electron";

export function appRoot(): string {
  return app.isPackaged
    ? path.dirname(process.execPath)
    : path.resolve(__dirname, "..", "..", "..");
}

export function webuiRoot(): string {
  return path.join(appRoot(), "vendor", "hermes-webui");
}

export function agentReferenceRoot(): string {
  return path.join(appRoot(), "vendor", "hermes-agent");
}

export function desktopStateRoot(): string {
  return path.join(app.getPath("userData"), "state");
}

export function logPath(): string {
  return path.join(app.getPath("userData"), "hermes-webui.log");
}

export function hermesHomePath(): string {
  return path.join(app.getPath("home"), ".hermes");
}

export function localHermesPath(): string {
  return path.join(process.env.LOCALAPPDATA || path.join(app.getPath("home"), "AppData", "Local"), "hermes");
}
