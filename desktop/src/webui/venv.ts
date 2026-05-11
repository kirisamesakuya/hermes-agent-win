import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { LogBuffer } from "../logBuffer.js";
import { findPython, pythonInvocation } from "../probes.js";

export type PythonRuntime = {
  command: string;
  argsPrefix: string[];
};

export async function ensureWebuiPython(root: string, logs: LogBuffer): Promise<PythonRuntime> {
  const venvPython = path.join(root, ".venv", "Scripts", "python.exe");
  const requirements = path.join(root, "requirements.txt");
  if (!fs.existsSync(venvPython)) {
    const probe = await findPython();
    if (!probe.ok) throw new Error(probe.error || "Python launcher was not found.");
    const invocation = pythonInvocation(probe);
    logs.append(`[webui] Creating Python virtual environment at ${path.join(root, ".venv")}\n`);
    await runChecked(invocation.command, [...invocation.argsPrefix, "-m", "venv", ".venv"], root, logs);
  }

  const marker = path.join(root, ".venv", ".hermes-desktop-requirements");
  if (fs.existsSync(requirements) && !fs.existsSync(marker)) {
    logs.append("[webui] Installing WebUI Python requirements\n");
    await runChecked(venvPython, ["-m", "pip", "install", "-r", requirements], root, logs);
    fs.writeFileSync(marker, new Date().toISOString(), "utf8");
  }

  return { command: venvPython, argsPrefix: [] };
}

function runChecked(command: string, args: string[], cwd: string, logs: LogBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => logs.append(chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      logs.append(text);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}: ${stderr.trim()}`));
    });
  });
}
