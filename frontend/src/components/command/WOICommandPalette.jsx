import React, { useEffect, useMemo, useState } from "react";

export default function WOICommandPalette({ onPick }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/woi/ops/palette?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setItems(data.items || []);
    };
    load();
  }, [query]);

  const grouped = useMemo(() => items.slice(0, 10), [items]);

  return (
    <div
      style={{
        background: "#0b1220",
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 12 }}>⌘ WOI Command Palette</div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search commands..."
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          background: "#111827",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 12,
        }}
      />

      <div style={{ display: "grid", gap: 8 }}>
        {grouped.map((item) => (
          <button
            key={item.id}
            onClick={() => onPick?.(item)}
            style={{
              textAlign: "left",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 12,
              cursor: "pointer",
            }}
          >
            {item.label}
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{item.target_tab}</div>
          </button>
        ))}
      </div>
    </div>
  );
}