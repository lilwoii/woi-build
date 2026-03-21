import React, { useEffect, useMemo, useRef, useState } from "react";
import { woiApi } from "../../services/woiApi";
import WOIPolyLedgerPanel from "./WOIPolyLedgerPanel";
import "./woiPolish.css";

function LineChart({ points, height = 120 }) {
  const W = 900;
  const H = height;
  if (!points?.length) return <div style={{ opacity: 0.7, fontSize: 12 }}>No chart points yet. Click 🧾📈 Snapshot.</div>;

  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanY = Math.max(1e-9, maxY - minY);

  const sx = (i) => (i / Math.max(1, points.length - 1)) * (W - 20) + 10;
  const sy = (y) => (H - 10) - ((y - minY) / spanY) * (H - 20);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  const last = points[points.length - 1]?.y ?? 0;
  const emo = last > 0 ? "🟩" : last < 0 ? "🟥" : "🟨";

  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
        {emo} Latest: {Number(last).toFixed(4)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        <path d={d} fill="none" stroke="rgba(120,255,210,0.95)" strokeWidth="2" />
        <line x1="10" y1={sy(0)} x2={W - 10} y2={sy(0)} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      </svg>
    </div>
  );
}

async function captureNodeToPngDataUrl(node) {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(node, { backgroundColor: "#0b0f14", scale: 2 });
  return canvas.toDataURL("image/png");
}

export default function WOIPolyAnalyticsPanel() {
  const [series, setSeries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [autoOn, setAutoOn] = useState(false);
  const [tradeCardAuto, setTradeCardAuto] = useState(false);

  const analyticsRef = useRef(null);
  const ledgerRef = useRef(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const s = await woiApi.polyPnLTimeseries(500);
      setSeries(s.items || []);
      const h = await woiApi.health();
      setAutoOn(!!h.auto_snapshots);
      setTradeCardAuto(!!h.trade_card_auto);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const snapshot = async () => {
    setBusy(true);
    try {
      await woiApi.polySnapshot();
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleAuto = async () => {
    setBusy(true);
    try {
      const next = !autoOn;
      await woiApi.polyAutoSnapshots(next);
      setAutoOn(next);
    } finally {
      setBusy(false);
    }
  };

  const toggleTradeCard = async () => {
    setBusy(true);
    try {
      const next = !tradeCardAuto;
      await woiApi.tradeCardToggle(next);
      setTradeCardAuto(next);
    } finally {
      setBusy(false);
    }
  };

  const sendVisual = async (which) => {
    setBusy(true);
    try {
      const node = which === "ledger" ? ledgerRef.current : analyticsRef.current;
      const png = await captureNodeToPngDataUrl(node);
      const last = series[series.length - 1] || {};
      const total = Number(last.realized || 0) + Number(last.unrealized || 0);
      const emo = total > 0 ? "🟩" : total < 0 ? "🟥" : "🟨";
      const title = which === "ledger" ? `📸 ${emo} WOI Ledger Snapshot` : `📸 ${emo} WOI Analytics Snapshot`;
      await woiApi.uploadSnapshotPng(png, title, { total_pnl: total.toFixed(4), source: last.source || "" });
      alert("Sent snapshot to Discord ✅");
    } catch (e) {
      alert(`Snapshot failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const logDigest = async () => {
    setBusy(true);
    try {
      await woiApi.logsSnapshot();
      alert("Sent log digest ✅");
    } finally {
      setBusy(false);
    }
  };

  const forceTradeCard = async () => {
    setBusy(true);
    try {
      await woiApi.tradeCardNow("manual");
      alert("Sent Trade Card ✅");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const pnlPoints = useMemo(() => series.map((r) => ({ x: r.ts_utc, y: Number(r.realized || 0) + Number(r.unrealized || 0) })), [series]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div ref={analyticsRef} className="woi-card woi-fade-in" style={{
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,14,18,0.65)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontWeight: 1000, letterSpacing: 1 }}>📈 Polymarket Analytics</div>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <button disabled={busy} onClick={()=>sendVisual("analytics")} className="woi-btn">📸 Snapshot Analytics</button>
            <button disabled={busy} onClick={()=>sendVisual("ledger")} className="woi-btn">📸 Snapshot Ledger</button>
            <a className="woi-btn" href={woiApi.polyLedgerCsvUrl()} target="_blank" rel="noreferrer">📤 Export CSV</a>
            <button disabled={busy} onClick={logDigest} className="woi-btn">📦 Log Digest</button>
            <button disabled={busy} onClick={toggleAuto} className="woi-btn">🧠 Auto: {autoOn ? "ON" : "OFF"}</button>
            <button disabled={busy} onClick={snapshot} className="woi-btn">🧾📈 Snapshot</button>
            <button disabled={busy} onClick={toggleTradeCard} className="woi-btn">🃏 TradeCard Auto: {tradeCardAuto ? "ON" : "OFF"}</button>
            <button disabled={busy} onClick={forceTradeCard} className="woi-btn">🃏 Send Trade Card</button>
            <button disabled={busy} onClick={refresh} className="woi-btn">🔄 Refresh</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8, opacity: 0.9 }}>Overall (Realized+Unrealized)</div>
          <LineChart points={pnlPoints} />
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Bundle 15 adds server-side Trade Cards + smart visual alerts (rate-limited).
        </div>
      </div>

      <div ref={ledgerRef}>
        <WOIPolyLedgerPanel />
      </div>
    </div>
  );
}
