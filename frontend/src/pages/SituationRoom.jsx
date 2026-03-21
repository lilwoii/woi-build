import React, { useEffect, useState } from "react";
import PulseCard from "../components/situation/PulseCard";
import HeatPanel from "../components/situation/HeatPanel";

export default function SituationRoom() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const load = async () => {
      const [cRes, sRes, tRes, sumRes, heatRes] = await Promise.all([
        fetch("/api/woi/situation/countries"),
        fetch("/api/woi/situation/states"),
        fetch("/api/woi/situation/telemetry"),
        fetch("/api/woi/situation/summary"),
        fetch("/api/woi/situation/heat"),
      ]);

      const c = await cRes.json();
      const s = await sRes.json();
      const t = await tRes.json();
      const sum = await sumRes.json();
      const heat = await heatRes.json();

      setCountries(heat.countries || c.items || []);
      setStates(heat.states || s.items || []);
      setTelemetry(t.items || []);
      setSummary(sum.summary || "");
    };

    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🌍 Situation Room</div>
        <div style={{ opacity: 0.8 }}>
          Desktop-first world monitor • country/state pulse • public telemetry • AI summary of what matters now
        </div>
      </div>

      <div
        style={{
          background: "#111827",
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
        }}
      >
        {summary || "Loading Situation Room summary..."}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <HeatPanel title="🗺️ Country Heat" items={countries} icon="🌍" />
        <HeatPanel title="🇺🇸 State Heat" items={states} icon="📍" />
      </div>

      <div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>📡 Public Telemetry Watch</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {telemetry.map((item) => (
            <PulseCard
              key={item.telemetry_id}
              item={item}
              icon={
                item.kind === "flight" ? "✈️" :
                item.kind === "maritime" ? "🚢" :
                item.kind === "disaster" ? "🌋" :
                item.kind === "infrastructure" ? "🏗️" :
                "🛰️"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}