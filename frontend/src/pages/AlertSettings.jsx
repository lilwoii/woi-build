import React, { useEffect, useState } from "react";

export default function AlertSettings() {
  const [prefs, setPrefs] = useState(null);

  const load = async () => {
    const res = await fetch("/api/woi/agents/alert-prefs");
    const data = await res.json();
    setPrefs(data.prefs || null);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (next) => {
    setPrefs(next);
    await fetch("/api/woi/agents/alert-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  if (!prefs) return <div style={{ padding: 18, color: "#fff" }}>Loading alert settings…</div>;

  const toggleRoot = (key) => save({ ...prefs, [key]: !prefs[key] });
  const toggleFeature = (key) =>
    save({
      ...prefs,
      features: {
        ...prefs.features,
        [key]: !prefs.features[key],
      },
    });

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🔔 Alert Settings</div>
        <div style={{ opacity: 0.8 }}>
          Discord and in-app alerts first. Desktop notifications stay optional.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {[
          ["discord_enabled", "📣 Discord Alerts"],
          ["in_app_enabled", "📲 In-App Alerts"],
          ["desktop_enabled", "🖥️ Desktop Alerts"],
          ["critical_only", "🚨 Critical Only"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleRoot(key)}
            style={{
              borderRadius: 14,
              padding: 16,
              background: prefs[key] ? "rgba(34,197,94,0.18)" : "#111827",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.10)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 800 }}>{label}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>{String(prefs[key])}</div>
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#0b1220",
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 12 }}>Feature Toggles</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {Object.entries(prefs.features || {}).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleFeature(key)}
              style={{
                borderRadius: 12,
                padding: 14,
                background: value ? "rgba(59,130,246,0.18)" : "#111827",
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
    </div>
  );
}