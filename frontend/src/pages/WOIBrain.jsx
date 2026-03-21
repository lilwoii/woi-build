import React, { useEffect, useState } from "react";

export default function WOIBrain() {
  const [brain, setBrain] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/mega/brain/state");
      const data = await res.json();
      setBrain(data.brain || null);
    };
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  if (!brain) {
    return <div style={{ padding: 18, color: "#fff" }}>🧠 Loading WOI Brain…</div>;
  }

  return (
    <div style={{ padding: 18, color: "#fff" }}>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🧠 WOI Brain</div>
      <div style={{ opacity: 0.8, marginBottom: 18 }}>
        Personality • emotions • operating mode • priorities • counters
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          ["⚙️ Status", brain.status],
          ["📡 Focus", brain.active_focus],
          ["🌊 Regime", brain.market_regime],
          ["🎭 Emotion", brain.personality?.emotion],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "#111827", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{label}</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>🧠 Personality Profile</div>
          <div>Mode: {brain.personality?.mode}</div>
          <div>Voice: {brain.personality?.voice}</div>
          <div>Confidence bias: {brain.personality?.confidence_bias}</div>
          <div>Urgency bias: {brain.personality?.urgency_bias}</div>
          <div>Risk bias: {brain.personality?.risk_bias}</div>
          <div style={{ marginTop: 12, opacity: 0.85 }}>{brain.last_summary}</div>
        </div>

        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>📌 Top Priorities</div>
          {(brain.top_priorities || []).map((x) => (
            <div key={x} style={{ marginBottom: 8 }}>{x}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, background: "#111827", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 Counters</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
          {Object.entries(brain.counters || {}).map(([k, v]) => (
            <div key={k} style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12 }}>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{k}</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}