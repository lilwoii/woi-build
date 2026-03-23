import React, { useEffect, useState } from "react";

export default function DesktopPrefsPanel() {
  const [prefs, setPrefs] = useState(null);

  const load = async () => {
    const res = await fetch("/api/woi/desktop/prefs");
    const data = await res.json();
    setPrefs(data.prefs || null);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (next) => {
    setPrefs(next);
    await fetch("/api/woi/desktop/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  if (!prefs) return <div style={{ color: "#fff" }}>Loading desktop prefs…</div>;

  return (
    <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontWeight: 900, marginBottom: 12 }}>🖥️ Desktop Preferences</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        {Object.entries(prefs).map(([key, value]) => (
          <button
            key={key}
            onClick={() => save({ ...prefs, [key]: !prefs[key] })}
            style={{
              borderRadius: 12,
              padding: 14,
              background: value ? "rgba(34,197,94,0.18)" : "#111827",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.10)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 800 }}>{key}</div>
            <div style={{ marginTop: 6, opacity: 0.8 }}>{String(value)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}