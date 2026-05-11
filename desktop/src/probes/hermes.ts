import fs from "node:fs";
import type { HermesInstallStatus } from "../types.js";
import { hermesHomePath, localHermesPath } from "../paths.js";
import { findPython } from "./python.js";
import { probeRuntime } from "./tools.js";

export async function getHermesStatus(): Promise<HermesInstallStatus> {
  const [hermes, python, uv, node, git] = await Promise.all([
    probeRuntime("hermes", ["--version"]),
    findPython(),
    probeRuntime("uv", ["--version"]),
    probeRuntime("node", ["--version"]),
    probeRuntime("git", ["--version"])
  ]);
  const localPath = localHermesPath();
  return {
    installed: hermes.ok || fs.existsSync(localPath),
    commandPath: hermes.ok ? "hermes" : null,
    homePath: hermesHomePath(),
    localAppDataPath: localPath,
    python,
    uv,
    node,
    git
  };
}
