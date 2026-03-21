import React, { useEffect, useState } from "react";

const badgeStyle = (urgency) => {
  const map = {
    low: { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" },
    medium: { background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.4)" },
    high: { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)" },
    critical: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" },
  };
  return map[(urgency || "").toLowerCase()] || map.medium;
};

function ChannelBox({ channel }) {
  return (
    <div style={{ background: "#111827", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{channel.channel}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{channel.summary}</div>
        </div>
        <div style={{ opacity: 0.85 }}>{channel.count} items</div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {channel.items.slice(0, 5).map((item) => (
          <div
            key={item.event_id}
            style={{
              borderRadius: 12,
              padding: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ ...badgeStyle(item.urgency), borderRadius: 999, padding: "4px 10px", fontSize: 12 }}>
                {item.urgency?.toUpperCase()}
              </div>
            </div>
            <div style={{ marginTop: 8, opacity: 0.82 }}>{item.summary}</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              🌍 {item.region} • 📰 {item.source_count} sources • 📊 impact {Math.round((item.market_impact_score || 0) * 100)}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              🔗 Symbols: {(item.linked_symbols || []).join(", ") || "—"}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
              🎯 Polymarket: {(item.linked_prediction_markets || []).join(", ") || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GlobeIntel() {
  const [channels, setChannels] = useState([]);
  const [points, setPoints] = useState([]);
  const [panels, setPanels] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [cRes, mRes, pRes] = await Promise.all([
        fetch("/api/woi/mega/globe/channels"),
        fetch("/api/woi/mega/globe/map"),
        fetch("/api/woi/mega/globe/watch-panels"),
      ]);
      const c = await cRes.json();
      const m = await mRes.json();
      const p = await pRes.json();
      setChannels(c.channels || []);
      setPoints(m.points || []);
      setPanels(p.panels || []);
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 18, color: "#fff" }}>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🌍 Globe Intel</div>
      <div style={{ opacity: 0.8, marginBottom: 18 }}>
        Live world event ingestion • macro / geopolitical / economic classification • linked symbols • prediction relevance
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, minHeight: 240, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>🗺️ Live Globe / Map Feed</div>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>
            Placeholder map surface for moveable globe integration from your existing bundle history.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {points.slice(0, 6).map((p) => (
              <div
                key={p.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
                  {p.region} • {p.category} • impact {Math.round((p.impact || 0) * 100)}
                </div>
                <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                  lat {p.lat} / lon {p.lon}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {panels.map((panel) => (
            <div
              key={panel.label}
              style={{
                background: "#111827",
                borderRadius: 16,
                padding: 14,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{panel.label}</div>
              <div style={{ marginTop: 8, opacity: 0.8 }}>{(panel.symbols || []).join(" • ")}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
        {channels.map((channel) => (
          <ChannelBox key={channel.channel} channel={channel} />
        ))}
      </div>
    </div>
  );
}