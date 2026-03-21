import React, { useEffect, useState } from "react";
import MovableOpsGlobe from "../components/globe/MovableOpsGlobe";
import WOICommandPalette from "../components/command/WOICommandPalette";

export default function GlobalOps() {
  const [points, setPoints] = useState([]);
  const [summary, setSummary] = useState("");
  const [adapters, setAdapters] = useState([]);
  const [routed, setRouted] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [mapRes, sumRes, adapterRes] = await Promise.all([
        fetch("/api/woi/mega/globe/map"),
        fetch("/api/woi/situation/summary"),
        fetch("/api/woi/ops/adapters"),
      ]);

      const map = await mapRes.json();
      const sum = await sumRes.json();
      const ads = await adapterRes.json();

      setPoints(map.points || []);
      setSummary(sum.summary || "");
      setAdapters(ads.items || []);
    };

    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const handlePalettePick = async (item) => {
    setRouted((prev) => [{ label: item.label, target_tab: item.target_tab }, ...prev].slice(0, 8));
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🌍 Global Ops</div>
        <div style={{ opacity: 0.8 }}>
          Moveable globe • situation summary • source adapters • command palette
        </div>
      </div>

      <MovableOpsGlobe points={points} />

      <div
        style={{
          background: "#111827",
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          whiteSpace: "pre-wrap",
        }}
      >
        {summary || "Loading situation summary..."}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <WOICommandPalette onPick={handlePalettePick} />

        <div
          style={{
            background: "#0b1220",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 12 }}>🧩 Source Adapters</div>
          <div style={{ display: "grid", gap: 10 }}>
            {adapters.map((a) => (
              <div
                key={a.adapter_id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>{a.label}</div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  {a.kind} • refresh {a.refresh_sec}s • {a.status}
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, marginTop: 6 }}>
                  {(a.coverage || []).join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#0b1220",
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 12 }}>⌘ Recent Command Routing</div>
        <div style={{ display: "grid", gap: 8 }}>
          {routed.map((r, idx) => (
            <div key={idx} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
              {r.label} → {r.target_tab}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}