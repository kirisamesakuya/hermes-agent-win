import io
import json
import os
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse


sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
WEBUI_ROOT = ROOT / "vendor" / "hermes-webui"
sys.path.insert(0, str(WEBUI_ROOT))


class FakeHandler:
    def __init__(self) -> None:
        self.status = None
        self.headers = {}
        self.response_headers = []
        self.wfile = io.BytesIO()

    def send_response(self, status: int) -> None:
        self.status = status

    def send_header(self, key: str, value: str) -> None:
        self.response_headers.append((key, value))

    def end_headers(self) -> None:
        pass


def read_json(handler: FakeHandler) -> dict:
    return json.loads(handler.wfile.getvalue().decode("utf-8"))


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="hermes-desktop-api-") as temp_dir:
        state_dir = Path(temp_dir) / "state"
        workspace_dir = Path(temp_dir) / "workspace"
        workspace_dir.mkdir(parents=True)
        os.environ["HERMES_WEBUI_STATE_DIR"] = str(state_dir)
        os.environ["HERMES_WEBUI_DEFAULT_WORKSPACE"] = str(workspace_dir)

        from api.desktop import handle_desktop_get, handle_desktop_post  # noqa: E402

        os.environ.pop("HERMES_DESKTOP", None)
        disabled = FakeHandler()
        if handle_desktop_get(disabled, urlparse("/api/desktop/status")):
            print("desktop API should be disabled without HERMES_DESKTOP", file=sys.stderr)
            return 1

        os.environ["HERMES_DESKTOP"] = "1"
        enabled = FakeHandler()
        if not handle_desktop_get(enabled, urlparse("/api/desktop/status")):
            print("desktop API status route was not handled", file=sys.stderr)
            return 1
        if enabled.status != 200:
            print(f"unexpected status: {enabled.status}", file=sys.stderr)
            return 1
        payload = read_json(enabled)
        if payload.get("desktop") is not True or "workspaces" not in payload:
            print(f"unexpected payload: {payload}", file=sys.stderr)
            return 1

        post = FakeHandler()
        body = {"workspace": str(workspace_dir)}
        if not handle_desktop_post(post, urlparse("/api/desktop/workspace"), body):
            print("desktop API workspace route was not handled", file=sys.stderr)
            return 1
        if post.status != 200:
            print(f"unexpected workspace status: {post.status}", file=sys.stderr)
            return 1
        workspace_payload = read_json(post)
        if workspace_payload.get("default_workspace") != str(workspace_dir.resolve()):
            print(f"workspace was not persisted: {workspace_payload}", file=sys.stderr)
            return 1
        if not any(item.get("path") == str(workspace_dir.resolve()) for item in workspace_payload.get("workspaces", [])):
            print(f"workspace list missing new path: {workspace_payload}", file=sys.stderr)
            return 1

    print("ok: desktop API environment gate, status route, and workspace route")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
