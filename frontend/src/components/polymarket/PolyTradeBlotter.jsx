import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

export default function PolyTradeBlotter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/woi/polymarket/blotter?limit=240`);
      const j = await r.json();
      setItems(j?.items || []);
    } catch {}
    setLoading(false);
  };

  const clear = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/woi/polymarket/blotter`, { method:"DELETE" });
      await load();
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ load(); const t=setInterval(load, 3000); return ()=>clearInterval(t); }, []);

  const pill = (t, tone="neutral") => {
    const bg = tone==="good" ? "rgba(120,255,210,0.12)" : tone==="bad" ? "rgba(255,90,90,0.10)" : "rgba(255,255,255,0.05)";
    const bc = tone==="good" ? "rgba(120,255,210,0.28)" : tone==="bad" ? "rgba(255,90,90,0.22)" : "rgba(255,255,255,0.10)";
    return <span style={{ fontSize:12, fontWeight:1000, padding:"7px 10px", borderRadius:999, border:`1px solid ${bc}`, background:bg }}>{t}</span>;
  };

  const kindTone = (k) => (k==="executed" ? "good" : (k==="blocked" || k==="error" ? "bad" : "neutral"));

  return (
    <div style={{
      border:"1px solid rgba(255,255,255,0.06)",
      background:"rgba(10,14,18,.62)", borderRadius:20, padding:14,
      boxShadow:"0 12px 34px rgba(0,0,0,.35)"
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div style={{ fontWeight:1200 }}>🧾 Trade Blotter (Guarded)</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={load} disabled={loading} style={{
            padding:"10px 12px", borderRadius:14, cursor:"pointer",
            border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)", fontWeight:1000
          }}>{loading?"Loading...":"↻ Refresh"}</button>
          <button onClick={clear} disabled={loading} style={{
            padding:"10px 12px", borderRadius:14, cursor:"pointer",
            border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)", fontWeight:1000
          }}>🧹 Clear</button>
        </div>
      </div>

      <div style={{ marginTop:12, maxHeight:360, overflow:"auto", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
        {items.length===0 ? (
          <div style={{ padding:14, opacity:0.65, fontSize:12 }}>No blotter events yet. When strategies call execute_order(), entries will appear here.</div>
        ) : (
          items.slice().reverse().map((it, idx)=>(
            <div key={idx} style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:12, display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ opacity:0.65, minWidth:108 }}>{(it.ts_utc||"").slice(11,19)}</div>
              <div style={{ minWidth:110 }}>{pill(it.kind || "event", kindTone(it.kind))}</div>
              <div style={{ fontWeight:1000 }}>{it.tag || "unknown"}</div>
              <div style={{ opacity:0.8 }}>{(it.side||"").toUpperCase()}</div>
              <div style={{ opacity:0.8 }}>p {it.price ?? "-"}</div>
              <div style={{ opacity:0.8 }}>sz {it.size ?? "-"}</div>
              <div style={{ marginLeft:"auto", opacity:0.7, display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
                {it.reason ? pill(`reason: ${String(it.reason).slice(0,28)}`, "bad") : null}
                {it.slippage!=null ? pill(`slip: ${Number(it.slippage).toFixed(4)}`, it.slippage>0.02 ? "bad":"neutral") : null}
                {it.fill_price!=null ? pill(`fill: ${Number(it.fill_price).toFixed(4)}`, "good") : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
