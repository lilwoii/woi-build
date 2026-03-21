import React, { useEffect, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiPortfolio.css";
import "./woiPolish.css";

export default function WOIPortfolioPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const res = await woiApi.polyPortfolio();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const positions = data?.positions || [];
  const exposure = data?.exposure_usd_est ?? 0;

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div className="woi-pt-grid">
        <div className="woi-pt-row" style={{ justifyContent:"space-between" }}>
          <div style={{ fontWeight: 1000, letterSpacing: 1 }}>🧳 Polymarket Portfolio</div>
          <div className="woi-pt-row">
            <span className="woi-pt-pill">Source: {data?.source || "—"}</span>
            <span className="woi-pt-pill">Exposure (est): {exposure.toFixed(4)}</span>
            <button className="woi-btn" disabled={busy} onClick={refresh}
              style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table className="woi-pt-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Qty</th>
                <th>Avg Cost</th>
                <th>Mark</th>
                <th>Settlement</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, idx) => (
                <tr key={idx}>
                  <td className="woi-pt-mono">{p.token_id}</td>
                  <td className="woi-pt-mono">{Number(p.qty).toFixed(4)}</td>
                  <td className="woi-pt-mono">{Number(p.avg_cost).toFixed(4)}</td>
                  <td className="woi-pt-mono">{p.mark == null ? "—" : Number(p.mark).toFixed(4)}</td>
                  <td className="woi-pt-mono">{p.settlement == null ? "—" : Number(p.settlement).toFixed(2)}</td>
                </tr>
              ))}
              {!positions.length && (
                <tr><td colSpan={5} style={{ opacity: 0.65, padding: 14 }}>No open positions detected.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 12, opacity: 0.70 }}>
          Allocation guardrails enforce max exposure and per-hour risk budget. Tune in `.env` (Bundle 8).
        </div>
      </div>
    </div>
  );
}
