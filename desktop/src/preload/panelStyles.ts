export const desktopPanelStyles = `
  #hermes-desktop-panel {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483647;
    width: 320px;
    max-width: calc(100vw - 32px);
    font: 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
    color: #f8fafc;
  }
  #hermes-desktop-panel .hd-card {
    display: none;
    border: 1px solid rgba(148, 163, 184, .35);
    background: rgba(15, 23, 42, .96);
    box-shadow: 0 18px 50px rgba(0,0,0,.35);
    border-radius: 8px;
    overflow: hidden;
  }
  #hermes-desktop-panel[data-open="1"] .hd-card { display: block; }
  #hermes-desktop-panel .hd-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, .25);
  }
  #hermes-desktop-panel .hd-body { padding: 12px; }
  #hermes-desktop-panel .hd-lang {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: #cbd5e1;
    font-size: 12px;
  }
  #hermes-desktop-panel .hd-lang select {
    flex: 1;
    min-height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(148, 163, 184, .35);
    background: #020617;
    color: #f8fafc;
    padding: 0 6px;
  }
  #hermes-desktop-panel .hd-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  #hermes-desktop-panel button {
    min-height: 32px;
    border: 1px solid rgba(148, 163, 184, .35);
    border-radius: 6px;
    background: #111827;
    color: #f8fafc;
    cursor: pointer;
  }
  #hermes-desktop-panel button:hover { background: #1f2937; }
  #hermes-desktop-panel .hd-fab {
    float: right;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: #0f172a;
  }
  #hermes-desktop-panel pre {
    max-height: 180px;
    overflow: auto;
    white-space: pre-wrap;
    margin: 10px 0 0;
    padding: 8px;
    border-radius: 6px;
    background: #020617;
    color: #cbd5e1;
  }
`;
