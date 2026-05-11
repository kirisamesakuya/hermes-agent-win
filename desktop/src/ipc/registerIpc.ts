import { registerInstallerIpc } from "../installer.js";
import { registerLogsIpc } from "./logsIpc.js";
import { registerOpenPathIpc } from "./openPathIpc.js";
import { registerStatusIpc } from "./statusIpc.js";
import type { IpcContext } from "./types.js";
import { registerWebuiIpc } from "./webuiIpc.js";
import { registerWorkspaceIpc } from "./workspaceIpc.js";

export function registerIpc(context: IpcContext): void {
  registerStatusIpc(context);
  registerWebuiIpc(context);
  registerLogsIpc(context);
  registerWorkspaceIpc(context);
  registerOpenPathIpc();
  registerInstallerIpc(context.logs);
}
