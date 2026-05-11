import { ipcMain } from "electron";
import type { AppLocale } from "../i18n/appLocale.js";
import { getAppLocale } from "../i18n/localeRuntime.js";

export function registerLocaleIpc(applyLocale: (next: AppLocale) => void): void {
  ipcMain.handle("hermes:get-locale", () => getAppLocale());
  ipcMain.handle("hermes:set-locale", (_event, next: unknown) => {
    if (next !== "zh" && next !== "en") return { ok: false as const };
    applyLocale(next);
    return { ok: true as const };
  });
}
