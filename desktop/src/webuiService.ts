import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { BrowserWindow } from "electron";
import { LogBuffer } from "./logBuffer.js";
import { desktopStateRoot, hermesHomePath, webuiRoot } from "./paths.js";
import { findPython, pythonInvocation } from "./probes.js";
import { WebuiStatus } from "./types.js";

export class WebuiService {
  private child: ChildProcessWithoutNullStreams | null = null;
  private statusValue: WebuiStatus = {
    running: false,
    starting: false,
    port: null,
    url: null,
    pid: null,
    lastExitCode: null,
    lastError: null
  };

  constructor(private readonly logs: LogBuffer) {}

  status(): WebuiStatus {
    return { ...this.statusValue };
  }

  async start(): Promise<WebuiStatus> {
    if (this.child && this.statusValue.running) return this.status();
    if (this.statusValue.starting) return this.status();

    const root = webuiRoot();
    if (!fs.existsSync(path.join(root, "server.py"))) {
      this.statusValue.lastError = `Missing WebUI source at ${root}`;
      return this.status();
    }

    let pythonCommand: string;
    let pythonArgsPrefix: string[];
    try {
      const runtime = await ensureWebuiPython(root, this.logs);
      pythonCommand = runtime.command;
      pythonArgsPrefix = runtime.argsPrefix;
    } catch (error) {
      this.statusValue.lastError = error instanceof Error ? error.message : String(error);
      return this.status();
    }
    const port = await findFreePort(8787);
    const env = {
      ...process.env,
      HERMES_DESKTOP: "1",
      HERMES_WEBUI_HOST: "127.0.0.1",
      HERMES_WEBUI_PORT: String(port),
      HERMES_WEBUI_STATE_DIR: path.join(desktopStateRoot(), "webui"),
      HERMES_HOME: process.env.HERMES_HOME || hermesHomePath(),
      PYTHONUNBUFFERED: "1"
    };

    fs.mkdirSync(env.HERMES_WEBUI_STATE_DIR, { recursive: true });
    this.statusValue = {
      running: false,
      starting: true,
      port,
      url: `http://127.0.0.1:${port}`,
      pid: null,
      lastExitCode: null,
      lastError: null
    };
    this.broadcast();

    const args = [...pythonArgsPrefix, "server.py"];
    this.logs.append(`[webui] Starting ${pythonCommand} ${args.join(" ")} in ${root}\n`);
    this.child = spawn(pythonCommand, args, {
      cwd: root,
      env,
      windowsHide: true
    });
    this.statusValue.pid = this.child.pid ?? null;

    this.child.stdout.on("data", (chunk: Buffer) => this.logs.append(chunk.toString()));
    this.child.stderr.on("data", (chunk: Buffer) => this.logs.append(chunk.toString()));
    this.child.on("error", (error) => {
      this.statusValue.starting = false;
      this.statusValue.running = false;
      this.statusValue.lastError = error.message;
      this.logs.append(`[webui] ${error.message}\n`);
      this.broadcast();
    });
    this.child.on("exit", (code) => {
      this.statusValue.starting = false;
      this.statusValue.running = false;
      this.statusValue.pid = null;
      this.statusValue.lastExitCode = code;
      this.logs.append(`[webui] exited with ${code}\n`);
      this.child = null;
      this.broadcast();
    });

    try {
      await waitForHealth(this.statusValue.url!, 30000);
      this.statusValue.starting = false;
      this.statusValue.running = true;
      this.broadcast();
    } catch (error) {
      this.statusValue.starting = false;
      this.statusValue.running = false;
      this.statusValue.lastError = error instanceof Error ? error.message : String(error);
      this.broadcast();
    }
    return this.status();
  }

  async restart(): Promise<WebuiStatus> {
    await this.stop();
    return this.start();
  }

  async stop(): Promise<void> {
    if (!this.child) return;
    const child = this.child;
    this.child = null;
    await new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
      child.kill();
      setTimeout(resolve, 3000);
    });
  }

  private broadcast(): void {
    const status = this.status();
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send("hermes-webui-event", status);
    }
  }
}

async function ensureWebuiPython(
  root: string,
  logs: LogBuffer
): Promise<{ command: string; argsPrefix: string[] }> {
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

async function findFreePort(start: number): Promise<number> {
  for (let port = start; port < start + 50; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error("No free localhost port found for Hermes WebUI.");
}

function canListen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function waitForHealth(baseUrl: string, timeoutMs: number): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Wait for the Python server to bind.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for Hermes WebUI /health.");
}
