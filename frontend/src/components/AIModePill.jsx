import React from "react";
import { useAIMode } from "../context/AIModeContext";

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 999,
  border: "1px solid #1f2933",
  background: "#020617",
  color: "#e5e7eb",
  padding: "6px 10px",
  fontSize: 12,
};

const btnStyle = (active) => ({
  border: active ? "1px solid #38bdf8" : "1px solid #111827",
  background: "#020617",
  color: "#e5e7eb",
  borderRadius: 999,
  padding: "4px 10px",
  cursor: "pointer",
  fontSize: 12,
  boxShadow: active ? "0 0 0 1px rgba(56,189,248,0.35)" : "none",
});

export default function AIModePill() {
  const { aiMode, setAiMode } = useAIMode();

  return (
    <div style={pillStyle} title="Active AI Mode">
      <span style={{ opacity: 0.75 }}>AI:</span>
      <button style={btnStyle(aiMode === "fast")} onClick={() => setAiMode("fast")}>
        ⚡ Fast
      </button>
      <button style={btnStyle(aiMode === "deep")} onClick={() => setAiMode("deep")}>
        🧠 Deep
      </button>
      <button style={btnStyle(aiMode === "master")} onClick={() => setAiMode("master")}>
        👑 Master
      </button>
    </div>
  );
}
