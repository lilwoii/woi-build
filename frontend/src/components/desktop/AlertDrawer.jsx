import React, { useEffect, useState } from "react";

export default function AlertDrawer() {
  const [items, setItems] = useState([]);
  const [prefs, setPrefs] = useState(null);

  const load = async () => {
    const [alertsRes, prefsRes] = await Promise.all([
      fetch("/api/woi/desktop/alerts"),
      fetch("/api/woi/desktop/prefs"),
    ]);
    const alerts = await alertsRes.json();
    const prefsJson = await prefsRes.json();
    setItems(alerts.items || []);
    setPrefs(prefsJson.prefs || null);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!prefs?.desktop_notifications_enabled || !("Notification" in window)) return;

    Notification.requestPermission();

    const latest = items[0];
    if (!latest || !latest.desktop_eligible || latest.read) return;

    if (prefs.desktop_notifications_critical_only && latest.level !== "error") return;
    if (Notification.permission === "granted") {
      new Notification(latest.title, { body: latest.body });
    }
  }, [items, prefs]);

  const markRead = async (alertId) => {
    await fetch("/api/woi/desktop/alerts/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId }),
    });
    load();
  };

  const clear = async () => {
    await fetch("/api/woi/desktop/alerts/clear", { method: "POST" });
    load();
  };

  return (
    <div
      style={{
        background: "#0b1220",
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 900 }}>🔔 Alert Center</div>
        <button
          onClick={clear}
          style={{
            borderRadius: 10,
            padding: "8px 12px",
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer",
          }}
        >
          Clear Non-Sticky
        </button>
      </div>

      <div style={{ display: "grid", gap: 10, maxHeight: 460, overflowY: "auto" }}>
        {items.map((item) => (
          <div
            key={item.alert_id}
            style={{
              background: item.read ? "#111827" : "rgba(59,130,246,0.12)",
              borderRadius: 12,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>{item.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{item.level}</div>
            </div>
            <div style={{ marginTop: 8, opacity: 0.85 }}>{item.body}</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              {item.feature} • {item.ts_utc}
            </div>
            {!item.read && (
              <button
                onClick={() => markRead(item.alert_id)}
                style={{
                  marginTop: 10,
                  borderRadius: 10,
                  padding: "8px 12px",
                  background: "#1f2937",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.10)",
                  cursor: "pointer",
                }}
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}