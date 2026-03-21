import React, { useEffect, useMemo, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiPolish.css";

export default function WOIPnLBreakdownPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const res = await woiApi.polyPnLBreakdown();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const byStrategy = useMemo(() => {
    const m = data?.by_strategy || {};
    return Object.entries(m).map(([k,v]) => ({
      strategy: k,
      trades: v.trades || 0,
      buy: v.buy_notional || 0,
      sell: v.sell_notional || 0,
      fees: v.fees || 0,
      score: (v.sell_notional||0) - (v.buy_notional||0) - (v.fees||0),
    })).sort((a,b)=>b.score-a.score).slice(0, 12);
  }, [data]);

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ fontWeight: 1000, letterSpacing: 1 }}>🧾 PnL Breakdown (Strategy)</div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, opacity:0.8 }}>Source: {data?.source || "—"}</span>
          <button className="woi-btn" disabled={busy} onClick={refresh}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ textAlign:"left", opacity:0.8 }}>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Strategy</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Trades</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Buy Notional</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Sell Notional</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Fees</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Score Est</th>
            </tr>
          </thead>
          <tbody>
            {byStrategy.map((r, idx) => (
              <tr key={idx}>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontFamily:"ui-monospace" }}>{r.strategy}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{r.trades}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{Number(r.buy).toFixed(4)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{Number(r.sell).toFixed(4)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{Number(r.fees).toFixed(4)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontWeight:900 }}>{Number(r.score).toFixed(4)}</td>
              </tr>
            ))}
            {!byStrategy.length && (
              <tr><td colSpan={6} style={{ padding: 12, opacity: 0.65 }}>No strategy rows yet (needs journal trades).</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Score Est is a conservative proxy. Next bundle will compute full grouped realized/unrealized PnL per strategy.
      </div>
    </div>
  );
}
