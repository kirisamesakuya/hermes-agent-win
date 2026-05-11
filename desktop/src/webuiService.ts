import fs from "node:fs";
import path from "node:path";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { BrowserWindow } from "electron";
import { LogBuffer } from "./logBuffer.js";
import { desktopStateRoot, hermesHomePath, webuiRoot } from "./paths.js";
import { WebuiStatus } from "./types.js";
import { waitForHealth } from "./webui/health.js";
import { findFreePort } from "./webui/ports.js";
import { ensureWebuiPython } from "./webui/venv.js";

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
