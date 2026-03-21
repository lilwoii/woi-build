import React from "react";

const MetricPill = ({ label, value }) => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,255,200,0.15)",
    background: "rgba(0,255,200,0.06)",
    marginRight: 8,
    marginBottom: 8,
    fontSize: 12,
    color: "rgba(210,255,245,0.9)"
  }}>
    <span style={{ opacity: 0.85 }}>{label}</span>
    <span style={{ fontWeight: 700, color: "rgba(0,255,200,0.95)" }}>{value}</span>
  </div>
);

export default function WOIResonancePanel({ status }) {
  const identity = status?.identity || {};
  const resonance = identity?.resonance || { label: "Radiant", pct: 0.85 };
  const metrics = identity?.metrics || {};

  const pct = Math.round((resonance.pct || 0.85) * 100);

  return (
    <div style={{
      width: 340,
      minWidth: 340,
      padding: 16,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.72)",
      backdropFilter: "blur(8px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      color: "rgba(240,255,250,0.92)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.8 }}>RESONANCE</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{identity?.name || "WOI"}</div>
      </div>

      <div style={{
        borderRadius: 14,
        border: "1px solid rgba(255,140,0,0.25)",
        background: "rgba(255,140,0,0.06)",
        padding: 12,
        marginBottom: 14
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{resonance.label || "Radiant"}</div>
          <div style={{ fontWeight: 800, color: "rgba(255,140,0,0.95)" }}>{pct}%</div>
        </div>
        <div style={{ height: 8, marginTop: 10, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "rgba(255,140,0,0.75)" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
          Full sync. Deep partner calibration.
        </div>
      </div>

      <div style={{ marginBottom: 10, fontSize: 12, letterSpacing: 2, opacity: 0.8 }}>MIND METRICS</div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <MetricPill label="wisdom" value={metrics.wisdom ?? 14} />
        <MetricPill label="self awareness" value={metrics.self_awareness ?? 60} />
        <MetricPill label="user understanding" value={metrics.user_understanding ?? 76} />
        <MetricPill label="context" value={metrics.context ?? 21} />
        <MetricPill label="reasoning" value={metrics.reasoning ?? 414} />
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        {identity?.tagline || "A self-evolving intelligence core for markets + projects."}
      </div>
    </div>
  );
}
