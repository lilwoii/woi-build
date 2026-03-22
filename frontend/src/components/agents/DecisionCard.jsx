import React from "react";

export default function DecisionCard({ item }) {
  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 16,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>
          {item.role} • {item.agent_id}
        </div>
        <div style={{ opacity: 0.75 }}>
          conf {item.confidence} • urg {item.urgency}
        </div>
      </div>
      <div style={{ marginTop: 8, opacity: 0.85 }}>{item.summary}</div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        stance: {item.stance}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        🔗 {(item.linked_symbols || []).join(", ") || "—"}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
        🎯 {(item.linked_prediction_markets || []).join(", ") || "—"}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
        ⚙️ {(item.actions || []).join(", ") || "—"}
      </div>
    </div>
  );
}