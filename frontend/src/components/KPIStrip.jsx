import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const Pill = ({ label, value, hint }) => (
  <div
    title={hint || ""}
    style={{
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid #111827",
      background: "#020617",
      fontSize: 12,
      color: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ color: "#94a3b8" }}>{label}</span>
    <span style={{ fontWeight: 800 }}>{value}</span>
  </div>
);

const KPIStrip = ({ compact = false }) => {
  const [kpi, setKpi] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/kpi`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setKpi(data);
      } catch {
        // ignore
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!kpi) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: compact ? "flex-end" : "space-between",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: compact ? 0 : 10,
      }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Pill label="Watchlist" value={kpi.watchlist_count ?? 0} />
        <Pill label="Alerts" value={kpi.alerts_count ?? 0} />
        <Pill label="Trades" value={kpi.trades_count ?? 0} />
        <Pill label="PM Trades" value={kpi.pm_trades_count ?? 0} />
        <Pill label="Interactions" value={kpi.interactions_count ?? 0} hint="Coach + extension data points stored for retrieval & later training" />
      </div>
    </div>
  );
};

export default KPIStrip;
