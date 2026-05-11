import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RuntimeProbe } from "../types.js";

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
