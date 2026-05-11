import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { HermesInstallStatus, RuntimeProbe } from "./types.js";
import { hermesHomePath, localHermesPath } from "./paths.js";

const execFileAsync = promisify(execFile);

export async function probeRuntime(command: string, args: string[]): Promise<RuntimeProbe> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      windowsHide: true,
      timeout: 8000
    });
    return {
      ok: true,
      command,
      args,
      version: `${stdout}${stderr}`.trim().split(/\r?\n/)[0] || null,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      command,
      args,
      version: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function findPython(): Promise<RuntimeProbe> {
  const candidates: Array<[string, string[]]> = [
    ["py", ["-3.11", "--version"]],
    ["py", ["-3.12", "--version"]],
    ["py", ["-3", "--version"]],
    ["python3", ["--version"]],
    ["python", ["--version"]]
  ];
  for (const [command, args] of candidates) {
    const result = await probeRuntime(command, args);
    if (result.ok) return result;
  }
  return probeRuntime("python", ["--version"]);
}

export function pythonInvocation(probe: RuntimeProbe): { command: string; argsPrefix: string[] } {
  if (probe.command === "py") {
    const selector = probe.args.find((arg) => arg.startsWith("-3")) || "-3";
    return { command: "py", argsPrefix: [selector] };
  }
  return { command: probe.command, argsPrefix: [] };
}

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
