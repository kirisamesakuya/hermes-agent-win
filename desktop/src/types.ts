export type HermesInstallStatus = {
  installed: boolean;
  commandPath: string | null;
  homePath: string;
  localAppDataPath: string;
  python: RuntimeProbe;
  uv: RuntimeProbe;
  node: RuntimeProbe;
  git: RuntimeProbe;
};

export type RuntimeProbe = {
  ok: boolean;
  command: string;
  args: string[];
  version: string | null;
  error: string | null;
};

export type WebuiStatus = {
  running: boolean;
  starting: boolean;
  port: number | null;
  url: string | null;
  pid: number | null;
  lastExitCode: number | null;
  lastError: string | null;
};

export type DesktopStatus = {
  hermes: HermesInstallStatus;
  webui: WebuiStatus;
  paths: {
    appRoot: string;
    webuiRoot: string;
    agentReferenceRoot: string;
    logPath: string;
  };
};

export type InstallEvent = {
  type: "start" | "stdout" | "stderr" | "exit" | "error";
  message: string;
  code?: number | null;
};

export type DesktopApi = {
  getStatus(): Promise<DesktopStatus>;
  installHermes(): Promise<{ started: boolean }>;
  restartWebui(): Promise<WebuiStatus>;
  pickWorkspace(): Promise<{ canceled: boolean; path: string | null }>;
  tailLogs(lines?: number): Promise<string>;
  openPath(target: "logs" | "hermesHome" | "webuiRoot" | string): Promise<{ ok: boolean; error?: string }>;
  onInstallEvent(callback: (event: InstallEvent) => void): () => void;
  onWebuiEvent(callback: (status: WebuiStatus) => void): () => void;
};
