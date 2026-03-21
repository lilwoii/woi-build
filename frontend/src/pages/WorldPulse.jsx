import React, { useEffect, useState } from "react";
import PulseCard from "../components/situation/PulseCard";

export default function WorldPulse() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/woi/situation/countries"),
        fetch("/api/woi/situation/states"),
      ]);
      const c = await cRes.json();
      const s = await sRes.json();
      setCountries(c.items || []);
      setStates(s.items || []);
    };

    load();
    const timer = setInterval(load, 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 18 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🌐 World Pulse</div>
        <div style={{ opacity: 0.8 }}>
          What countries and states are up to right now, ranked for urgency and score
        </div>
      </div>

      <div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>🌍 Country Pulse</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {countries.map((item) => (
            <PulseCard key={item.pulse_id} item={item} icon="🌍" />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>📍 State Pulse</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {states.map((item) => (
            <PulseCard key={item.pulse_id} item={item} icon="📍" />
          ))}
        </div>
      </div>
    </div>
  );
}