"""
Desktop-only API helpers for the Windows Electron shell.

These endpoints are intentionally inert unless HERMES_DESKTOP=1 is present.
The desktop shell uses them to sync native workspace choices into the existing
WebUI state model without duplicating sessions, model config, or chat logic.
"""

import os
import platform
from pathlib import Path

from api.config import load_settings, save_settings
from api.helpers import bad, j
from api.updates import WEBUI_VERSION
from api.workspace import (
    load_workspaces,
    save_workspaces,
    set_last_workspace,
    validate_workspace_to_add,
)


def desktop_enabled() -> bool:
    return os.getenv("HERMES_DESKTOP", "").strip().lower() in {"1", "true", "yes", "on"}


def handle_desktop_get(handler, parsed) -> bool:
    if not desktop_enabled():
        return False

    if parsed.path == "/api/desktop/status":
        settings = load_settings()
        j(
            handler,
            {
                "desktop": True,
                "platform": platform.platform(),
                "version": WEBUI_VERSION,
                "default_workspace": settings.get("default_workspace"),
                "workspaces": load_workspaces(),
            },
        )
        return True

    return False


def handle_desktop_post(handler, parsed, body) -> bool:
    if not desktop_enabled():
        return False

    if parsed.path == "/api/desktop/workspace":
        raw = str(body.get("workspace") or body.get("path") or "").strip()
        if not raw:
            return bad(handler, "workspace is required")
        try:
            candidate = Path(raw).expanduser()
            candidate.mkdir(parents=True, exist_ok=True)
            workspace = validate_workspace_to_add(str(candidate))
        except Exception as exc:
            return bad(handler, str(exc))

        workspace_str = str(workspace)
        settings = load_settings()
        settings["default_workspace"] = workspace_str
        save_settings(settings)
        set_last_workspace(workspace_str)

        workspaces = load_workspaces()
        if not any(item.get("path") == workspace_str for item in workspaces):
            workspaces.append({"path": workspace_str, "name": workspace.name or "Workspace"})
            save_workspaces(workspaces)

        j(
            handler,
            {
                "ok": True,
                "default_workspace": workspace_str,
                "workspaces": workspaces,
            },
        )
        return True

    return False
