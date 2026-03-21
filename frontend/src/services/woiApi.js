import { API_BASE_URL } from "../config";

const base = API_BASE_URL || "http://localhost:8000";

async function post(path, body = {}) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WOI API ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}

async function get(path) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WOI API ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}

export const woiApi = {
  health: () => get("/api/woi/health"),
  opsStatus: () => get("/api/woi/ops/status"),

  chat: (message, tier = "deep", mode = "assistant") =>
    post("/api/woi/chat", { message, tier, mode }),

  polyLedger: () => get("/api/woi/polymarket/ledger"),
  polyGroupedPnL: () => get("/api/woi/polymarket/grouped_pnl"),
  polyPnLTimeseries: (limit = 500) => get(`/api/woi/polymarket/pnl_timeseries?limit=${limit}`),
  polyStrategyTimeseries: (strategy, limit = 500) =>
    get(`/api/woi/polymarket/strategy_timeseries?strategy=${encodeURIComponent(strategy)}&limit=${limit}`),

  polySnapshot: () => post("/api/woi/polymarket/pnl_snapshot", {}),
  polyAutoSnapshots: (enabled) => post("/api/woi/polymarket/auto_snapshots", { enabled }),

  logsRecent: (limit=200) => get(`/api/woi/logs/recent?limit=${limit}`),
  logsSnapshot: () => post("/api/woi/logs/snapshot", {}),

  uploadSnapshotPng: (png_base64, title="📸 WOI Snapshot", meta={}) =>
    post("/api/woi/snapshots/upload_png", { png_base64, title, meta }),

  visualAlertsToggle: (enabled) => post("/api/woi/alerts/visual_auto", { enabled }),
  visualAlertNow: (reason="manual") => post("/api/woi/alerts/visual_snapshot", { reason }),

  tradeCardToggle: (enabled) => post("/api/woi/alerts/trade_card_auto", { enabled }),
  tradeCardNow: (reason="manual") => post("/api/woi/alerts/trade_card", { reason }),

  polyLedgerCsvUrl: () => `${base}/api/woi/polymarket/ledger.csv`,
};
