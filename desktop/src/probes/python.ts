import type { RuntimeProbe } from "../types.js";
import { probeRuntime } from "./tools.js";

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
