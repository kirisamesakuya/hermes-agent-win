import fs from "node:fs";
import path from "node:path";
import { t } from "./i18n/strings.js";

const root = path.resolve(__dirname, "..", "..", "..");
const required = [
  "dist/desktop/src/main.js",
  "dist/desktop/src/preload.js",
  "dist/desktop/src/app/createWindow.js",
  "dist/desktop/src/diagnostics/collectDiagnostics.js",
  "dist/desktop/src/i18n/localeRuntime.js",
  "dist/desktop/src/i18n/strings.js",
  "dist/desktop/src/ipc/localeIpc.js",
  "dist/desktop/src/ipc/registerIpc.js",
  "dist/desktop/src/ipc/statusIpc.js",
  "dist/desktop/src/ipc/workspaceIpc.js",
  "dist/desktop/src/installer/hermesInstaller.js",
  "dist/desktop/src/probes/hermes.js",
  "dist/desktop/src/smokePorts.js",
  "dist/desktop/src/webui/loadWebui.js",
  "dist/desktop/src/webui/venv.js",
  "vendor/hermes-webui/server.py",
  "vendor/hermes-webui/api/routes.py",
  "vendor/hermes-agent/README.md"
];

const sourceAssertions: Array<{ file: string; snippets: string[] }> = [
  {
    file: "desktop/src/app/createWindow.ts",
    snippets: [
      "contextIsolation: true",
      "nodeIntegration: false",
      "event.preventDefault()",
      "win.hide()"
    ]
  },
  {
    file: "desktop/src/webuiService.ts",
    snippets: [
      'HERMES_DESKTOP: "1"',
      'HERMES_WEBUI_HOST: "127.0.0.1"'
    ]
  },
  {
    file: "desktop/src/i18n/localeRuntime.ts",
    snippets: [
      'const DEFAULT_LOCALE: AppLocale = "zh"'
    ]
  },
  {
    file: "desktop/src/ipc/localeIpc.ts",
    snippets: [
      'next !== "zh" && next !== "en"',
      '"hermes:set-locale"'
    ]
  },
  {
    file: "desktop/src/main.ts",
    snippets: [
      '"hermes-locale-changed"',
      "syncWebuiLangFromDesktopShell"
    ]
  },
  {
    file: "desktop/src/ipc/openPathIpc.ts",
    snippets: [
      'case "logs"',
      'case "hermesHome"',
      'case "webuiRoot"',
      "Unsupported path target"
    ]
  },
  {
    file: "vendor/hermes-webui/api/desktop.py",
    snippets: [
      "def desktop_enabled()",
      'os.getenv("HERMES_DESKTOP"',
      'parsed.path == "/api/desktop/status"',
      'parsed.path == "/api/desktop/workspace"'
    ]
  }
];

const maxTypeScriptLines = 300;
const forbiddenDirectoryNames = new Set(["__pycache__"]);
let failed = false;

for (const rel of required) {
  const target = path.join(root, rel);
  if (!fs.existsSync(target)) {
    failed = true;
    console.error(`missing: ${rel}`);
  } else {
    console.log(`ok: ${rel}`);
  }
}

for (const rel of findTypeScriptFiles(path.join(root, "desktop", "src"))) {
  const text = fs.readFileSync(path.join(root, rel), "utf8");
  const lines = text.split(/\r?\n/).length;
  if (lines > maxTypeScriptLines) {
    failed = true;
    console.error(`too large: ${rel} has ${lines} lines`);
  }
}

for (const assertion of sourceAssertions) {
  const target = path.join(root, assertion.file);
  const text = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  for (const snippet of assertion.snippets) {
    if (!text.includes(snippet)) {
      failed = true;
      console.error(`missing snippet in ${assertion.file}: ${snippet}`);
    }
  }
}

const translationChecks: Array<[string, string]> = [
  [t("zh", "menuLanguageZh"), "简体中文"],
  [t("en", "menuLanguageEn"), "English"],
  [t("en", "installerExit", { code: 7 }), "Installer exited with 7"]
];
for (const [actual, expected] of translationChecks) {
  if (actual !== expected) {
    failed = true;
    console.error(`unexpected translation: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

for (const rel of findForbiddenDirectories(path.join(root, "desktop"), path.join(root, "scripts"))) {
  failed = true;
  console.error(`forbidden generated directory: ${rel}`);
}

if (failed) process.exit(1);

function findTypeScriptFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findTypeScriptFiles(target));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      found.push(path.relative(root, target));
    }
  }
  return found;
}

function findForbiddenDirectories(...dirs: string[]): string[] {
  const found: string[] = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (!entry.isDirectory()) continue;
      if (forbiddenDirectoryNames.has(entry.name)) {
        found.push(path.relative(root, target));
      } else {
        found.push(...findForbiddenDirectories(target));
      }
    }
  }
  return found;
}
