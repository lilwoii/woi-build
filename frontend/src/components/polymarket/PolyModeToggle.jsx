import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

export default function PolyModeToggle() {
  const [mode, setMode] = useState({ live_enabled: false, shadow_enabled: true });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/woi/polymarket/mode`);
      const j = await r.json();
      if (j?.mode) setMode(j.mode);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const set = async (patch) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/woi/polymarket/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (j?.mode) setMode(j.mode);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontWeight:1000 }}>🧪 Shadow Mode</span>
        <button
          onClick={() => set({ shadow_enabled: !mode.shadow_enabled })}
          disabled={loading}
          style={{
            padding:"8px 10px", borderRadius:12, cursor:"pointer",
            border:"1px solid rgba(255,255,255,0.10)",
            background: mode.shadow_enabled ? "rgba(120,255,210,0.14)" : "rgba(255,255,255,0.05)",
            fontWeight:1000
          }}
        >
          {mode.shadow_enabled ? "ON ✅" : "OFF"}
        </button>

        <span style={{ fontWeight:1000, marginLeft:10 }}>💰 Live Money</span>
        <button
          onClick={() => set({ live_enabled: !mode.live_enabled })}
          disabled={loading}
          style={{
            padding:"8px 10px", borderRadius:12, cursor:"pointer",
            border:"1px solid rgba(255,255,255,0.10)",
            background: mode.live_enabled ? "rgba(255,90,90,0.14)" : "rgba(255,255,255,0.05)",
            fontWeight:1100
          }}
          title="Live trading uses real money. Risk governor can auto-disable it."
        >
          {mode.live_enabled ? "LIVE ✅" : "OFF (safe)"}
        </button>

        <button
          onClick={() => set({ live_enabled: false })}
          disabled={loading || !mode.live_enabled}
          style={{
            padding:"8px 10px", borderRadius:12, cursor:"pointer",
            border:"1px solid rgba(255,255,255,0.10)",
            background:"rgba(255,255,255,0.05)",
            fontWeight:1100
          }}
        >
          🛑 Force Disable Live
        </button>

        <button onClick={load} disabled={loading} style={{
          padding:"8px 10px", borderRadius:12, cursor:"pointer",
          border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.05)", fontWeight:900
        }}>↻ Refresh</button>
      </div>

      <div style={{ fontSize:12, opacity:0.75 }}>
        Default: <b>Live OFF</b> + <b>Shadow ON</b>. Shadow logs paper orders so you can validate strategies safely.
      </div>
    </div>
  );
}
