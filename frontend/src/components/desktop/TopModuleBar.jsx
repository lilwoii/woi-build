import React from "react";

export default function TopModuleBar({ tabs = [], activeTab, onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        padding: "0 0 6px 0",
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect?.(tab.id)}
            style={{
              whiteSpace: "nowrap",
              borderRadius: 12,
              padding: "10px 14px",
              background: active ? "rgba(59,130,246,0.20)" : "#111827",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.10)",
              fontWeight: active ? 800 : 600,
              cursor: "pointer",
            }}
          >
            {tab.icon ? `${tab.icon} ` : ""}{tab.label}
          </button>
        );
      })}
    </div>
  );
}