import React, { useEffect, useState } from "react";

const columns = [
  { key: "draft", label: "📝 Draft" },
  { key: "paper-observing", label: "🧪 Paper" },
  { key: "shadow-live", label: "👻 Shadow" },
  { key: "guarded-live", label: "🟢 Guarded" },
  { key: "paused", label: "⏸️ Paused" },
  { key: "killed", label: "🛑 Killed" },
  { key: "retired", label: "🏁 Retired" },
];

export default function StrategyOpsBoard() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/mega/strategy/lifecycle");
      const data = await res.json();
      setItems(data.board?.items || []);
    };
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(220px, 1fr))", gap: 12, overflowX: "auto" }}>
      {columns.map((col) => {
        const filtered = items.filter((x) => x.stage === col.key);
        return (
          <div key={col.key} style={{ background: "#0b1220", borderRadius: 16, padding: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{col.label}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((item) => (
                <div key={item.strategy_id} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>{item.symbol}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>score {item.score} • conf {item.confidence}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{item.last_result}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}