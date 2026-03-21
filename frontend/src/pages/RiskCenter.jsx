import React, { useEffect, useState } from "react";

export default function RiskCenter() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/mega/risk/status");
      const data = await res.json();
      setStatus(data);
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (!status) return <div style={{ padding: 18, color: "#fff" }}>🛡️ Loading risk center…</div>;

  return (
    <div style={{ padding: 18, color: "#fff" }}>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🛡️ Risk Center</div>
      <div style={{ opacity: 0.8, marginBottom: 18 }}>
        Auto-kill switch • drawdown guard • loss streak guard • market stress guard
      </div>

      <div style={{ background: status.tripped ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>
          {status.tripped ? "🚨 KILL SWITCH TRIPPED" : "✅ Risk system armed"}
        </div>
        <div style={{ marginTop: 8 }}>{status.reason || "No active trigger."}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
        {Object.entries(status.config || {}).map(([k, v]) => (
          <div key={k} style={{ background: "#111827", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{k}</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}