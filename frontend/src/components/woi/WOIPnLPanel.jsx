import React, { useEffect, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiPortfolio.css";
import "./woiPolish.css";

export default function WOIPnLPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const res = await woiApi.polyPnL();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const realized = data?.realized_pnl_est ?? 0;
  const unreal = data?.unrealized_pnl_est ?? 0;
  const fees = data?.fees_est ?? 0;

  const pill = (label) => (<span className="woi-pt-pill">{label}</span>);
  const emo = (v) => v > 0 ? "🟩" : v < 0 ? "🟥" : "🟨";

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div className="woi-pt-grid">
        <div className="woi-pt-row" style={{ justifyContent: "space-between" }}>
          <div style={{ fontWeight: 1000, letterSpacing: 1 }}>📈 Polymarket PnL (Reconciled)</div>
          <div className="woi-pt-row">
            {pill(`Source: ${data?.source || "—"}`)}
            {pill(`${emo(realized)} Realized: ${realized.toFixed(4)}`)}
            {pill(`${emo(unreal)} Unrealized: ${unreal.toFixed(4)}`)}
            {pill(`🧾 Fees: ${fees.toFixed(4)}`)}
            <button className="woi-btn" disabled={busy} onClick={refresh}
              style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.78 }}>
          If CLOB user trades are configured, WOI uses them for PnL; otherwise it uses the WOI journal. Settlement hooks included.
        </div>
      </div>
    </div>
  );
}
