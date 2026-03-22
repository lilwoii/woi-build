import React from "react";

export default function AgentCard({ agent }) {
  return (
    <div
      style={{
        background: "#0b1220",
        borderRadius: 16,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontWeight: 800 }}>{agent.agent_id}</div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>{agent.role}</div>
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>{agent.status}</div>
    </div>
  );
}