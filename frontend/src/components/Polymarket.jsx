import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import PolyModeToggle from "./polymarket/PolyModeToggle";
import PolyRiskPanel from "./polymarket/PolyRiskPanel";
import PolyTradeBlotter from "./polymarket/PolyTradeBlotter";

export default function Polymarket() {
  const [pnl, setPnl] = useState(null);
  const [ts, setTs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r1 = await fetch(`${API_BASE_URL}/api/woi/polymarket/pnl_timeseries?limit=300`);
      const j1 = await r1.json();
      setTs(j1?.items || []);

      const r2 = await fetch(`${API_BASE_URL}/api/woi/polymarket/pnl_snapshot`, { method:"POST" });
      const j2 = await r2.json();
      setPnl(j2?.snapshot || null);
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ load(); }, []);

  const pill = (t) => (
    <span style={{
      fontSize:12, fontWeight:1000, padding:"7px 10px", borderRadius:999,
      border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)"
    }}>{t}</span>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{
        border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(10,14,18,.62)", borderRadius:20, padding:16,
        boxShadow:"0 12px 34px rgba(0,0,0,.35)"
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:1200 }}>🟣 Polymarket</div>
            <div style={{ fontSize:12, opacity:0.75, marginTop:6 }}>
              pmxt executor + guarded blotter + risk governor.
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            {pill(`Last: ${pnl?.ts_utc ? pnl.ts_utc.slice(11,19) : "-"}`)}
            {pill(`Realized: ${Number(pnl?.realized||0).toFixed(2)}`)}
            {pill(`Unrealized: ${Number(pnl?.unrealized||0).toFixed(2)}`)}
            <button onClick={load} disabled={loading} style={{
              padding:"10px 12px", borderRadius:14, cursor:"pointer",
              border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)", fontWeight:1000
            }}>{loading?"Loading...":"↻ Refresh"}</button>
          </div>
        </div>
      </div>

      <div style={{
        border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(10,14,18,.62)", borderRadius:20, padding:14,
        boxShadow:"0 12px 34px rgba(0,0,0,.35)"
      }}>
        <div style={{ fontWeight:1100, marginBottom:10 }}>🧪 Modes</div>
        <PolyModeToggle />
      </div>

      <PolyRiskPanel />
      <PolyTradeBlotter />

      <div style={{
        border:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(10,14,18,.62)", borderRadius:20, padding:14,
        boxShadow:"0 12px 34px rgba(0,0,0,.35)"
      }}>
        <div style={{ fontWeight:1100, marginBottom:10 }}>📈 PnL Time Series (latest)</div>
        <div style={{ maxHeight:260, overflow:"auto", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
          {ts.length===0 ? (
            <div style={{ padding:14, opacity:0.65, fontSize:12 }}>No snapshots yet. Click Refresh.</div>
          ) : (
            ts.slice().reverse().slice(0,80).map((row, idx)=>(
              <div key={idx} style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:12, display:"flex", gap:10 }}>
                <div style={{ opacity:0.65, minWidth:108 }}>{(row.ts_utc||"").slice(11,19)}</div>
                <div style={{ fontWeight:900 }}>Σ {Number(row.realized||0).toFixed(2)} / {Number(row.unrealized||0).toFixed(2)}</div>
                <div style={{ opacity:0.7, marginLeft:"auto" }}>fees {Number(row.fees||0).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
