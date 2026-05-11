# Hermes Windows Desktop

Electron desktop shell for Hermes Agent on native Windows.

The app keeps `vendor/hermes-webui` as the local Python WebUI kernel and uses
Electron for Windows-native process control, workspace picking, diagnostics,
logs, tray/menu actions, and Hermes installer orchestration.

## Development

```powershell
npm install
npm run build
npm run dev
```

If the vendor folders are missing or stale:

```powershell
npm run sync:vendor
```

The desktop app binds the WebUI to `127.0.0.1`, starts it with
`HERMES_DESKTOP=1`, and exposes only a small preload IPC API to the page.

## Documents

- [Product Requirements](docs/PRD.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
