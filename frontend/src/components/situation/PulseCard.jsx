import React from "react";

const urgencyStyle = {
  low: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" },
  medium: { background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.4)" },
  high: { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)" },
  critical: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" },
};

export default function PulseCard({ item, icon = "🌍" }) {
  const style = urgencyStyle[(item.urgency || "medium").toLowerCase()] || urgencyStyle.medium;

  return (
    <div
      style={{
        background: "#0b1220",
        borderRadius: 16,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 800 }}>{icon} {item.name || item.zone}</div>
        <div style={{ ...style, borderRadius: 999, padding: "4px 10px", fontSize: 12 }}>
          {(item.urgency || "medium").toUpperCase()}
        </div>
      </div>

      <div style={{ marginTop: 8, opacity: 0.85 }}>{item.summary}</div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        📊 score {Math.round((item.score || 0) * 100)} • 🧭 {item.category || item.kind}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        🔗 {(item.linked_symbols || []).join(", ") || "—"}
      </div>

      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
        🎯 {(item.linked_prediction_markets || []).join(", ") || "—"}
      </div>
    </div>
  );
}