import React from "react";

function Row({ item, icon }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 0.6fr 0.8fr",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div>{icon} {item.name}</div>
      <div>{Math.round((item.score || 0) * 100)}</div>
      <div style={{ opacity: 0.8 }}>{item.urgency}</div>
    </div>
  );
}

export default function HeatPanel({ title, items = [], icon = "🌍" }) {
  return (
    <div
      style={{
        background: "#0b1220",
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.7, display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.8fr", gap: 10, marginBottom: 8 }}>
        <div>Name</div>
        <div>Score</div>
        <div>Urgency</div>
      </div>
      {(items || []).map((item) => (
        <Row key={item.name} item={item} icon={icon} />
      ))}
    </div>
  );
}