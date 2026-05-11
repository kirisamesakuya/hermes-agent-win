import type { DesktopStatus } from "../types.js";
import { agentReferenceRoot, appRoot, logPath, webuiRoot } from "../paths.js";
import { getHermesStatus } from "../probes.js";
import type { WebuiService } from "../webuiService.js";

export async function collectDiagnostics(webui: WebuiService): Promise<DesktopStatus> {
  return {
    hermes: await getHermesStatus(),
    webui: webui.status(),
    paths: {
      appRoot: appRoot(),
      webuiRoot: webuiRoot(),
      agentReferenceRoot: agentReferenceRoot(),
      logPath: logPath()
    }
  };
}
