import path from "node:path";
import { app, BrowserWindow, Menu, nativeImage, shell, Tray } from "electron";
import type { AppLocale } from "../i18n/appLocale.js";
import { t } from "../i18n/strings.js";
import { logPath } from "../paths.js";

export type TrayActions = {
  locale: AppLocale;
  getMainWindow: () => BrowserWindow | null;
  onRestartWebui: () => void;
  onSelectLocale: (locale: AppLocale) => void;
};

export function createTray({ locale, getMainWindow, onRestartWebui, onSelectLocale }: TrayActions): Tray {
  const tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip(t(locale, "trayTooltip"));
  const showWindow = () => {
    const win = getMainWindow();
    win?.show();
    win?.focus();
  };
  tray.on("double-click", showWindow);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: t(locale, "trayShow"),
        click: showWindow
      },
      { label: t(locale, "trayRestartWebui"), click: onRestartWebui },
      { label: t(locale, "trayOpenLogs"), click: () => void shell.openPath(path.dirname(logPath())) },
      {
        label: t(locale, "menuLanguageBar"),
        submenu: [
          {
            label: t(locale, "menuLanguageZh"),
            type: "radio",
            checked: locale === "zh",
            click: () => onSelectLocale("zh")
          },
          {
            label: t(locale, "menuLanguageEn"),
            type: "radio",
            checked: locale === "en",
            click: () => onSelectLocale("en")
          }
        ]
      },
      { type: "separator" },
      { label: t(locale, "trayQuit"), click: () => app.quit() }
    ])
  );
  return tray;
}
