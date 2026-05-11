import type { AppLocale } from "./appLocale.js";

export type MessageKey =
  | "windowTitle"
  | "menuApp"
  | "menuRestartWebui"
  | "menuOpenLogs"
  | "menuOpenHermesHome"
  | "menuLanguageBar"
  | "menuLanguage"
  | "menuLanguageZh"
  | "menuLanguageEn"
  | "menuQuit"
  | "menuEdit"
  | "menuUndo"
  | "menuRedo"
  | "menuCut"
  | "menuCopy"
  | "menuPaste"
  | "menuSelectAll"
  | "menuView"
  | "menuReload"
  | "menuForceReload"
  | "menuToggleDevTools"
  | "menuResetZoom"
  | "menuZoomIn"
  | "menuZoomOut"
  | "menuToggleFullscreen"
  | "trayTooltip"
  | "trayShow"
  | "trayRestartWebui"
  | "trayOpenLogs"
  | "trayQuit"
  | "panelTitle"
  | "panelCloseTitle"
  | "panelLoading"
  | "panelLanguage"
  | "panelWorkspace"
  | "panelRestart"
  | "panelInstall"
  | "panelLogs"
  | "panelFabTitle"
  | "panelHermesLabel"
  | "panelWebuiLabel"
  | "panelHermesInstalled"
  | "panelHermesNotFound"
  | "panelWebuiRunning"
  | "panelWebuiStarting"
  | "panelWebuiStopped"
  | "panelUrlPrefix"
  | "offlinePageTitle"
  | "offlineHeading"
  | "offlineRetry"
  | "offlineInstall"
  | "offlineLogs"
  | "offlineRestarting"
  | "offlineStartingInstaller"
  | "dialogWorkspaceTitle"
  | "webuiFailedStart"
  | "webuiFailedRestart"
  | "installerStarting"
  | "installerExit";

const zh: Record<MessageKey, string> = {
  windowTitle: "Hermes 桌面版",
  menuApp: "Hermes",
  menuRestartWebui: "重启 WebUI",
  menuOpenLogs: "打开日志",
  menuOpenHermesHome: "打开 Hermes 主目录",
  menuLanguageBar: "界面语言",
  menuLanguage: "语言",
  menuLanguageZh: "简体中文",
  menuLanguageEn: "English",
  menuQuit: "退出 Hermes 桌面版",
  menuEdit: "编辑",
  menuUndo: "撤销",
  menuRedo: "重做",
  menuCut: "剪切",
  menuCopy: "复制",
  menuPaste: "粘贴",
  menuSelectAll: "全选",
  menuView: "查看",
  menuReload: "重新加载",
  menuForceReload: "强制重新加载",
  menuToggleDevTools: "切换开发者工具",
  menuResetZoom: "实际大小",
  menuZoomIn: "放大",
  menuZoomOut: "缩小",
  menuToggleFullscreen: "切换全屏",
  trayTooltip: "Hermes 桌面版",
  trayShow: "显示 Hermes",
  trayRestartWebui: "重启 WebUI",
  trayOpenLogs: "打开日志",
  trayQuit: "退出",
  panelTitle: "Hermes 桌面版",
  panelCloseTitle: "关闭",
  panelLoading: "正在加载状态...",
  panelLanguage: "界面语言",
  panelWorkspace: "工作区",
  panelRestart: "重启",
  panelInstall: "安装 Hermes",
  panelLogs: "日志",
  panelFabTitle: "打开桌面面板",
  panelHermesLabel: "Hermes",
  panelWebuiLabel: "WebUI",
  panelHermesInstalled: "已安装",
  panelHermesNotFound: "未找到",
  panelWebuiRunning: "运行中",
  panelWebuiStarting: "启动中",
  panelWebuiStopped: "已停止",
  panelUrlPrefix: "地址",
  offlinePageTitle: "Hermes 桌面版",
  offlineHeading: "Hermes WebUI 未能启动",
  offlineRetry: "重启 WebUI",
  offlineInstall: "安装 Hermes",
  offlineLogs: "查看日志",
  offlineRestarting: "正在重启...",
  offlineStartingInstaller: "正在启动安装程序...\n",
  dialogWorkspaceTitle: "选择 Hermes 工作区",
  webuiFailedStart: "Hermes WebUI 启动失败。",
  webuiFailedRestart: "Hermes WebUI 重启失败。",
  installerStarting: "正在启动 Hermes Windows 安装程序...",
  installerExit: "安装程序已退出，代码：{code}"
};

const en: Record<MessageKey, string> = {
  windowTitle: "Hermes Desktop",
  menuApp: "Hermes",
  menuRestartWebui: "Restart WebUI",
  menuOpenLogs: "Open Logs",
  menuOpenHermesHome: "Open Hermes Home",
  menuLanguageBar: "Language",
  menuLanguage: "Language",
  menuLanguageZh: "简体中文",
  menuLanguageEn: "English",
  menuQuit: "Quit Hermes Desktop",
  menuEdit: "Edit",
  menuUndo: "Undo",
  menuRedo: "Redo",
  menuCut: "Cut",
  menuCopy: "Copy",
  menuPaste: "Paste",
  menuSelectAll: "Select All",
  menuView: "View",
  menuReload: "Reload",
  menuForceReload: "Force Reload",
  menuToggleDevTools: "Toggle Developer Tools",
  menuResetZoom: "Actual Size",
  menuZoomIn: "Zoom In",
  menuZoomOut: "Zoom Out",
  menuToggleFullscreen: "Toggle Full Screen",
  trayTooltip: "Hermes Desktop",
  trayShow: "Show Hermes",
  trayRestartWebui: "Restart WebUI",
  trayOpenLogs: "Open Logs",
  trayQuit: "Quit",
  panelTitle: "Hermes Desktop",
  panelCloseTitle: "Close",
  panelLoading: "Loading status...",
  panelLanguage: "Language",
  panelWorkspace: "Workspace",
  panelRestart: "Restart",
  panelInstall: "Install Hermes",
  panelLogs: "Logs",
  panelFabTitle: "Open desktop panel",
  panelHermesLabel: "Hermes",
  panelWebuiLabel: "WebUI",
  panelHermesInstalled: "installed",
  panelHermesNotFound: "not found",
  panelWebuiRunning: "running",
  panelWebuiStarting: "starting",
  panelWebuiStopped: "stopped",
  panelUrlPrefix: "URL",
  offlinePageTitle: "Hermes Desktop",
  offlineHeading: "Hermes WebUI did not start",
  offlineRetry: "Restart WebUI",
  offlineInstall: "Install Hermes",
  offlineLogs: "Show Logs",
  offlineRestarting: "Restarting...",
  offlineStartingInstaller: "Starting installer...\n",
  dialogWorkspaceTitle: "Choose Hermes workspace",
  webuiFailedStart: "Hermes WebUI failed to start.",
  webuiFailedRestart: "Hermes WebUI failed to restart.",
  installerStarting: "Starting Hermes Windows installer...",
  installerExit: "Installer exited with {code}"
};

const byLocale: Record<AppLocale, Record<MessageKey, string>> = { zh, en };

export function t(locale: AppLocale, key: MessageKey, vars?: Record<string, string | number>): string {
  let text = byLocale[locale][key] ?? en[key];
  if (vars) {
    for (const [keyName, value] of Object.entries(vars)) {
      text = text.replace(`{${keyName}}`, String(value));
    }
  }
  return text;
}
