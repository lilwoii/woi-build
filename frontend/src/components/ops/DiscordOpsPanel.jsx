import React, { useEffect, useState } from "react";

export default function DiscordOpsPanel() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/conversation/ops/recent");
      const data = await res.json();
      setItems(data.items || []);
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>📣 Discord / Ops Broadcasts</div>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight: 700 }}>{item.title}</div>
            <div style={{ marginTop: 6, opacity: 0.82 }}>{item.body}</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>level: {item.level}</div>
          </div>
        ))}
      </div>
    </div>
  );
}