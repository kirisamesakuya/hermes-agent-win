import path from "node:path";
import { Menu, shell } from "electron";
import type { AppLocale } from "../i18n/appLocale.js";
import { hermesHomePath, logPath } from "../paths.js";
import { t, type MessageKey } from "../i18n/strings.js";

export type MenuActions = {
  locale: AppLocale;
  onRestartWebui: () => void;
  onSelectLocale: (locale: AppLocale) => void;
};

export function createMenu({ locale, onRestartWebui, onSelectLocale }: MenuActions): void {
  const L = (key: MessageKey) => t(locale, key);

  const languageSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: L("menuLanguageZh"),
      type: "radio",
      checked: locale === "zh",
      click: () => onSelectLocale("zh")
    },
    {
      label: L("menuLanguageEn"),
      type: "radio",
      checked: locale === "en",
      click: () => onSelectLocale("en")
    }
  ];

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: L("menuLanguageBar"),
      submenu: languageSubmenu
    },
    {
      label: L("menuApp"),
      submenu: [
        { label: L("menuRestartWebui"), click: onRestartWebui },
        { label: L("menuOpenLogs"), click: () => void shell.openPath(path.dirname(logPath())) },
        { label: L("menuOpenHermesHome"), click: () => void shell.openPath(hermesHomePath()) },
        { type: "separator" },
        {
          label: L("menuLanguage"),
          submenu: languageSubmenu.map((item) => ({ ...item }))
        },
        { type: "separator" },
        { label: L("menuQuit"), role: "quit" }
      ]
    },
    {
      label: L("menuEdit"),
      submenu: [
        { label: L("menuUndo"), role: "undo" },
        { label: L("menuRedo"), role: "redo" },
        { type: "separator" },
        { label: L("menuCut"), role: "cut" },
        { label: L("menuCopy"), role: "copy" },
        { label: L("menuPaste"), role: "paste" },
        { type: "separator" },
        { label: L("menuSelectAll"), role: "selectAll" }
      ]
    },
    {
      label: L("menuView"),
      submenu: [
        { label: L("menuReload"), role: "reload" },
        { label: L("menuForceReload"), role: "forceReload" },
        { label: L("menuToggleDevTools"), role: "toggleDevTools" },
        { type: "separator" },
        { label: L("menuResetZoom"), role: "resetZoom" },
        { label: L("menuZoomIn"), role: "zoomIn" },
        { label: L("menuZoomOut"), role: "zoomOut" },
        { type: "separator" },
        { label: L("menuToggleFullscreen"), role: "togglefullscreen" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
