import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

const Card = ({ title, value, tone="neutral" }) => {
  const bg = tone==="good" ? "rgba(120,255,210,0.12)" : tone==="bad" ? "rgba(255,90,90,0.10)" : "rgba(255,255,255,0.05)";
  const bc = tone==="good" ? "rgba(120,255,210,0.30)" : tone==="bad" ? "rgba(255,90,90,0.25)" : "rgba(255,255,255,0.10)";
  return (
    <div style={{ border:`1px solid ${bc}`, background:bg, borderRadius:16, padding:12, minWidth:160 }}>
      <div style={{ fontSize:12, opacity:0.75, fontWeight:900 }}>{title}</div>
      <div style={{ marginTop:6, fontSize:16, fontWeight:1200 }}>{value}</div>
    </div>
  );
};

export default function PolyRiskPanel() {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/woi/alpha/risk/status`);
      const j = await r.json();
      setRisk(j);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t=setInterval(load, 5000); return ()=>clearInterval(t); }, []);

  const router = risk?.router_risk;
  const state = router?.state || {};
  const cfg = router?.config || {};
  const lastReason = state?.last_reason || "-";
  const armed = cfg?.armed;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontWeight:1200 }}>🛡️ Risk Governor</div>
        <button onClick={load} disabled={loading} style={{
          padding:"8px 10px", borderRadius:12, cursor:"pointer",
          border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)", fontWeight:900
        }}>↻ Refresh</button>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Card title="Armed" value={armed ? "ON ✅" : "OFF"} tone={armed ? "good" : "neutral"} />
        <Card title="Last Trip" value={lastReason} tone={lastReason && lastReason !== "-" ? "bad" : "neutral"} />
        <Card title="Slippage Samples" value={state?.slippage_samples ?? 0} />
        <Card title="Errors (10m)" value={state?.errors_recent ?? 0} tone={(state?.errors_recent ?? 0) >= (cfg?.error_spike ?? 6) ? "bad" : "neutral"} />
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Card title="Max Slippage" value={`${cfg?.max_slippage ?? "-"}`} />
        <Card title="Max PnL Std" value={`${cfg?.max_pnl_std ?? "-"}`} />
        <Card title="Max Drawdown" value={`${cfg?.max_drawdown ?? "-"}`} />
        <Card title="Cooldown Sec" value={`${cfg?.cooldown_sec ?? "-"}`} />
      </div>

      <div style={{ fontSize:12, opacity:0.72 }}>
        If risk trips, live money auto-disables and Discord gets 🔴 alerts.
      </div>
    </div>
  );
}
