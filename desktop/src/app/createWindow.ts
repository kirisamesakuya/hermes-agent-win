import path from "node:path";
import { BrowserWindow } from "electron";

export type CreateWindowOptions = {
  title: string;
  onClosed: (win: BrowserWindow) => void;
  shouldQuitOnClose: () => boolean;
};

export function createWindow({ title, onClosed, shouldQuitOnClose }: CreateWindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 980,
    minHeight: 680,
    title,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once("ready-to-show", () => win.show());
  win.on("close", (event) => {
    if (shouldQuitOnClose()) return;
    event.preventDefault();
    win.hide();
  });
  win.on("closed", () => onClosed(win));
  return win;
}
