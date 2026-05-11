import type { BrowserWindow } from "electron";
import type { AppLocale } from "../i18n/appLocale.js";
import { getAppLocale } from "../i18n/localeRuntime.js";
import { t } from "../i18n/strings.js";
import { offlinePageUrl } from "../pages/offlinePage.js";
import type { WebuiService } from "../webuiService.js";
import type { WebuiStatus } from "../types.js";

export async function startWebuiAndLoad(webui: WebuiService, win: BrowserWindow): Promise<WebuiStatus> {
  const status = await webui.start();
  const locale = getAppLocale();
  await loadWebuiStatus(win, status, t(locale, "webuiFailedStart"), locale);
  return status;
}

export async function restartWebuiAndLoad(webui: WebuiService, win: BrowserWindow): Promise<WebuiStatus> {
  const status = await webui.restart();
  const locale = getAppLocale();
  await loadWebuiStatus(win, status, t(locale, "webuiFailedRestart"), locale);
  return status;
}

async function loadWebuiStatus(
  win: BrowserWindow,
  status: WebuiStatus,
  fallbackMessage: string,
  locale: AppLocale
): Promise<void> {
  if (status.running && status.url) {
    await win.loadURL(status.url);
    return;
  }
  await win.loadURL(offlinePageUrl(status.lastError || fallbackMessage, locale));
}
