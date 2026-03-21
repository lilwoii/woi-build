import React from "react";

/**
 * Sidebar
 * - Matches App.jsx props: { tabs, activeTab, setActiveTab }
 * - Restores emoji-coded navigation + AI Engine footer status.
 */
export default function Sidebar({ tabs = [], activeTab, setActiveTab }) {
  const safeTabs = Array.isArray(tabs) ? tabs : [];

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: "#020617",
        borderRight: "1px solid #111827",
        padding: "16px 12px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Brand */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#22d3ee",
            marginBottom: 2,
            letterSpacing: 0.3,
          }}
        >
          WOIS Assistant
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>AI Trading Suite</div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {safeTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab?.(tab.id)}
              style={{
                textAlign: "left",
                borderRadius: 999,
                border: active ? "1px solid rgba(34,211,238,0.45)" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(34,211,238,0.10)" : "transparent",
                color: active ? "#e5e7eb" : "rgba(255,255,255,0.70)",
                fontSize: 12,
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
              title={tab.label}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 18, display: "inline-flex", justifyContent: "center" }}>{tab.icon || "•"}</span>
                <span>{tab.label}</span>
              </span>

              {active ? (
                <span
                  style={{
                    width: 6,
                    height: 18,
                    borderRadius: 999,
                    background: "#22d3ee",
                    boxShadow: "0 0 0 1px rgba(34,211,238,0.25)",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer status */}
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(15,23,42,0.75)",
          fontSize: 11,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "#22c55e",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.14)",
            }}
          />
          <span>AI Engine</span>
        </div>
        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.60)", lineHeight: 1.25 }}>
          Dashboard, AI Lab & signals are active.
        </div>
      </div>
    </aside>
  );
}
