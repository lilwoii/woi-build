import React, { useEffect, useState } from "react";

export default function HotkeysPanel() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/desktop/hotkeys");
      const data = await res.json();
      setItems(data.items || []);
    };
    load();
  }, []);

  return (
    <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontWeight: 900, marginBottom: 12 }}>⌨️ Desktop Hotkeys</div>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: "#111827", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 800 }}>{item.label}</div>
            <div style={{ marginTop: 6, opacity: 0.75 }}>{item.combo}</div>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.65 }}>{item.target}</div>
          </div>
        ))}
      </div>
    </div>
  );
}