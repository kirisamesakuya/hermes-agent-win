# Project Structure

## 1. 当前目录

```text
D:\hermes agent win
├─ desktop/
│  └─ src/
│     ├─ installer.ts
│     ├─ logBuffer.ts
│     ├─ main.ts
│     ├─ paths.ts
│     ├─ preload.ts
│     ├─ probes.ts
│     ├─ smoke.ts
│     ├─ types.ts
│     └─ webuiService.ts
├─ docs/
│  ├─ PRD.md
│  └─ PROJECT_STRUCTURE.md
├─ scripts/
│  └─ sync-vendor.ps1
├─ vendor/
│  ├─ hermes-agent/
│  └─ hermes-webui/
├─ .gitignore
├─ package-lock.json
├─ package.json
├─ README.md
├─ tsconfig.json
└─ vite.config.ts
```

## 2. 目录职责

### `desktop/`

Windows 桌面壳源码。只负责 Electron 桌面能力，不重写 Hermes WebUI 业务。

当前职责：
- 启动和停止 WebUI 子进程。
- 检测 Hermes/Python/uv/Node/Git。
- 调用 Hermes Windows installer。
- 暴露安全 preload API。
- 提供菜单、托盘、日志和诊断入口。

### `desktop/src/main.ts`

Electron 应用组装入口。

允许包含：
- `app.whenReady()`。
- 主窗口创建。
- 菜单和托盘组装。
- IPC 模块注册。
- WebUI 初始加载。

不允许包含：
- installer 具体实现。
- Python venv 创建细节。
- runtime 探测细节。
- 大段 UI HTML/CSS。
- WebUI 业务逻辑。

后续应拆分：
- `desktop/src/app/createWindow.ts`
- `desktop/src/app/menu.ts`
- `desktop/src/app/tray.ts`
- `desktop/src/ipc/registerIpc.ts`
- `desktop/src/pages/offlinePage.ts`

### `desktop/src/preload.ts`

安全桥接层。

当前职责：
- 通过 `contextBridge` 暴露 `window.hermesDesktop`。
- 注入轻量桌面浮层。

后续应拆分：
- `desktop/src/preload/api.ts`
- `desktop/src/preload/desktopPanel.ts`
- `desktop/src/preload/panelStyles.ts`

约束：
- 不引入 Node 文件系统能力给页面。
- 不暴露任意 shell 执行。
- 不做复杂业务状态管理。

### `desktop/src/webuiService.ts`

WebUI 子进程管理。

职责：
- 创建 `.venv`。
- 安装 `requirements.txt`。
- 查找可用端口。
- 启动 `server.py`。
- 等待 `/health`。
- 重启和停止子进程。
- 广播 WebUI 状态。

后续应拆分：
- `desktop/src/webui/venv.ts`
- `desktop/src/webui/ports.ts`
- `desktop/src/webui/health.ts`
- `desktop/src/webui/process.ts`

### `desktop/src/probes.ts`

运行时检测模块。

职责：
- 检测 Hermes。
- 检测 Python。
- 检测 uv、Node、Git。
- 生成统一 status payload。

后续可拆分：
- `desktop/src/probes/python.ts`
- `desktop/src/probes/hermes.ts`
- `desktop/src/probes/tools.ts`

### `desktop/src/installer.ts`

Hermes Windows installer 管理模块。

职责：
- 防止重复 installer。
- 调用官方 PowerShell installer。
- 捕获 stdout/stderr。
- 通过 IPC 广播安装事件。

后续可增强：
- 安装完成后自动重新 probe。
- 安装失败分类。
- 日志归档。

### `desktop/src/logBuffer.ts`

桌面日志缓存和落盘。

职责：
- 收集 WebUI stdout/stderr。
- 收集 installer 输出。
- 提供 tail 能力。

### `desktop/src/paths.ts`

路径集中管理。

职责：
- app root。
- vendor 路径。
- WebUI root。
- Hermes home。
- `%LOCALAPPDATA%\hermes`。
- 日志路径。

所有新模块需要路径时应复用这里，不要散落 `path.join(...)`。

### `desktop/src/types.ts`

共享 TypeScript 类型。

职责：
- Desktop API。
- runtime status。
- WebUI status。
- installer event。

新 IPC 接口必须先在这里定义类型。

### `vendor/hermes-webui/`

上游 Hermes WebUI。原则上保留上游结构，减少分叉。

本项目允许的小范围修改：
- 新增 `api/desktop.py`。
- 在 `api/routes.py` 挂载桌面 API。
- 必要时增加桌面环境兼容补丁。

禁止：
- 大规模重构 WebUI 前端。
- 把桌面 Electron 逻辑塞进 WebUI。
- 在 WebUI 中复制 Electron 进程管理能力。

### `vendor/hermes-agent/`

Hermes Agent 上游参考源码。正式运行优先使用官方 Windows installer 安装到 `%LOCALAPPDATA%\hermes`。

用途：
- 开发参考。
- 文档参考。
- 后续打包时可选择是否保留完整 vendor。

### `scripts/`

项目维护脚本。

当前：
- `sync-vendor.ps1`：通过 GitHub ZIP 同步上游 vendor 源码。

后续建议：
- `smoke-webui.ps1`
- `clean-artifacts.ps1`
- `package-win.ps1`

## 3. 下一阶段推荐目录

为了避免文件继续膨胀，下一阶段应调整为：

```text
desktop/
└─ src/
   ├─ app/
   │  ├─ createWindow.ts
   │  ├─ menu.ts
   │  └─ tray.ts
   ├─ installer/
   │  ├─ hermesInstaller.ts
   │  └─ installerEvents.ts
   ├─ ipc/
   │  ├─ registerIpc.ts
   │  ├─ statusIpc.ts
   │  ├─ workspaceIpc.ts
   │  └─ logsIpc.ts
   ├─ paths/
   │  └─ index.ts
   ├─ preload/
   │  ├─ api.ts
   │  ├─ desktopPanel.ts
   │  └─ desktopPanel.css.ts
   ├─ probes/
   │  ├─ hermes.ts
   │  ├─ python.ts
   │  └─ tools.ts
   ├─ webui/
   │  ├─ health.ts
   │  ├─ ports.ts
   │  ├─ process.ts
   │  ├─ venv.ts
   │  └─ webuiService.ts
   ├─ diagnostics/
   │  ├─ collectDiagnostics.ts
   │  └─ offlinePage.ts
   ├─ shared/
   │  ├─ logBuffer.ts
   │  └─ types.ts
   ├─ main.ts
   └─ smoke.ts
```

## 4. 模块拆分规则

- `main.ts` 只负责启动编排，目标小于 200 行。
- `preload.ts` 只负责 expose API，目标小于 150 行。
- 每个 IPC 文件只处理一类能力。
- 每个 service 只管理一个外部系统。
- UI 字符串、HTML、CSS 不放在 service 文件中。
- 进程管理不直接调用 UI。
- UI 不直接调用 `child_process`、`fs`、`shell`。

## 5. 复用清单

### 必须复用

- `hermes-webui` 的 session、workspace、settings、SSE、API routes。
- `hermes-agent` 官方安装脚本。
- Electron 的 dialog/menu/tray/shell/ipc/contextBridge。
- 现有 `paths.ts`、`probes.ts`、`webuiService.ts`、`installer.ts`。

### 可以新增

- 桌面诊断页。
- Electron builder 配置。
- 桌面设置页。
- IPC 拆分模块。
- smoke test 脚本。

### 不应新增

- 第二套 session 存储。
- 第二套 workspace 存储。
- 第二套 Hermes provider 配置。
- 任意命令执行 IPC。
- 巨型 `desktopManager.ts` 或 `desktopController.ts`。

## 6. 开发验收清单

每次 PR 或提交前检查：

- `npm run build`
- `npm run test:desktop`
- Python desktop API 能 py_compile。
- 没有新增超过 500 行的 TypeScript 文件。
- 新能力是否复用了现有模块。
- 新 IPC 是否在 `types.ts` 定义。
- 新路径是否走路径模块。
- 新 WebUI 能力是否放在独立 Python 模块，而不是继续塞进 `routes.py`。
- 没有把 secrets、venv、dist、node_modules、vendor zip 提交进 Git。
