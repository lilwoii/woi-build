import React, { useEffect, useMemo, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiTrades.css";
import "./woiPolish.css";

export default function WOITradesPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tokenFilter, setTokenFilter] = useState("");

  const refresh = async () => {
    setBusy(true);
    try {
      const pnl = await woiApi.polyPnL();
      setData(pnl);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const rows = useMemo(() => {
    const t = data?.trades || [];
    const f = tokenFilter.trim().toLowerCase();
    if (!f) return t;
    return t.filter(x => (x.token_id || "").toLowerCase().includes(f));
  }, [data, tokenFilter]);

  const realized = data?.realized_pnl_est ?? 0;
  const unreal = data?.unrealized_pnl_est ?? 0;

  const pnlEmoji = (v) => v > 0 ? "🟩" : v < 0 ? "🟥" : "🟨";

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10, flexWrap:"wrap" }}>
        <div style={{ fontWeight: 1000, letterSpacing: 1 }}>📒 Polymarket Trades + PnL</div>
        <div style={{ display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize: 12, fontWeight: 900, padding:"6px 10px", borderRadius: 999, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)" }}>
            {pnlEmoji(realized)} Realized: {realized.toFixed(4)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, padding:"6px 10px", borderRadius: 999, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)" }}>
            {pnlEmoji(unreal)} Unrealized: {unreal.toFixed(4)}
          </span>
          <button className="woi-btn" disabled={busy} onClick={refresh}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, display:"flex", gap: 10, alignItems:"center", flexWrap:"wrap" }}>
        <input value={tokenFilter} onChange={(e)=>setTokenFilter(e.target.value)} placeholder="Filter token_id..."
          className="woi-trades-mono"
          style={{ flex: 1, minWidth: 220, padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.20)", color:"rgba(240,255,250,0.95)" }} />
        <div style={{ fontSize: 12, opacity: 0.75 }}>Showing {rows.length} trades (latest first)</div>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table className="woi-trades-table">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Strategy</th>
              <th>Token</th>
              <th>Side</th>
              <th>Price</th>
              <th>Size</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, idx) => (
              <tr key={idx}>
                <td className="woi-trades-mono">{t.ts_utc}</td>
                <td>{t.strategy}</td>
                <td className="woi-trades-mono">{t.token_id}</td>
                <td>{t.side === "buy" ? "🟩 buy" : "🟥 sell"}</td>
                <td className="woi-trades-mono">{Number(t.price).toFixed(4)}</td>
                <td className="woi-trades-mono">{Number(t.size).toFixed(4)}</td>
                <td>{t.result?.dry_run ? "🟨 DRY" : "🟩 LIVE"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} style={{ opacity: 0.65, padding: 14 }}>No trades yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.70 }}>
        PnL is an estimate from your trade journal + current mid prices (orderbook). Exact settlement PnL can be added next.
      </div>
    </div>
  );
}
