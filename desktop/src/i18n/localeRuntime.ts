import fs from "node:fs";
import path from "node:path";
import { desktopStateRoot } from "../paths.js";
import type { AppLocale } from "./appLocale.js";

const DEFAULT_LOCALE: AppLocale = "zh";

let cache: AppLocale | null = null;

function localeFile(): string {
  return path.join(desktopStateRoot(), "locale.json");
}

export function getAppLocale(): AppLocale {
  if (cache !== null) return cache;
  try {
    const parsed = JSON.parse(fs.readFileSync(localeFile(), "utf8")) as { locale?: unknown };
    if (parsed.locale === "zh" || parsed.locale === "en") {
      cache = parsed.locale;
      return cache;
    }
  } catch {
    /* missing or invalid */
  }
  cache = DEFAULT_LOCALE;
  return cache;
}

export function setAppLocale(next: AppLocale): void {
  cache = next;
  fs.mkdirSync(path.dirname(localeFile()), { recursive: true });
  fs.writeFileSync(localeFile(), JSON.stringify({ locale: next }, null, 2), "utf8");
}
