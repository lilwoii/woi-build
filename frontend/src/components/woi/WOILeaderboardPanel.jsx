import React, { useEffect, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiPolish.css";

export default function WOILeaderboardPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const res = await woiApi.polyLeaderboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const items = data?.items || [];

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ fontWeight: 1000, letterSpacing: 1 }}>🏆 Strategy Leaderboard</div>
        <button className="woi-btn" disabled={busy} onClick={refresh}
          style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ marginTop: 12, display:"grid", gap:10 }}>
        {items.map((it, idx) => (
          <div key={idx} style={{
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            gap: 10,
            flexWrap:"wrap"
          }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ fontWeight: 1000 }}>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏷️"}</div>
              <div style={{ fontFamily:"ui-monospace", fontWeight: 900 }}>{it.strategy}</div>
              <div style={{ fontSize: 12, opacity: 0.78 }}>Trades: {it.trades}</div>
            </div>
            <div style={{ fontWeight: 1000 }}>Score Est: {Number(it.score_est || 0).toFixed(4)}</div>
          </div>
        ))}
        {!items.length && <div style={{ opacity:0.7 }}>No leaderboard items yet.</div>}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Refresh triggers a Discord snapshot (backend emits 🏆 POLY_LEADERBOARD).
      </div>
    </div>
  );
}
