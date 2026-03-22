import React, { useEffect, useState } from "react";

export default function Watchlists() {
  const [data, setData] = useState(null);
  const [kind, setKind] = useState("stocks");
  const [value, setValue] = useState("");

  const load = async () => {
    const res = await fetch("/api/woi/watchlists/");
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!value.trim()) return;
    await fetch("/api/woi/watchlists/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, value }),
    });
    setValue("");
    load();
  };

  const removeItem = async (removeKind, removeValue) => {
    await fetch("/api/woi/watchlists/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: removeKind, value: removeValue }),
    });
    load();
  };

  if (!data) return <div style={{ padding: 18, color: "#fff" }}>Loading watchlists…</div>;

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>👀 Watchlists</div>
        <div style={{ opacity: 0.8 }}>
          Auto-find symbols to watch + manual overrides for stocks, crypto, and Polymarket
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 12 }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: 12, borderRadius: 12, background: "#111827", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="stocks">stocks</option>
          <option value="crypto">crypto</option>
          <option value="polymarket">polymarket</option>
        </select>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add manual watch item..." style={{ padding: 12, borderRadius: 12, background: "#111827", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }} />
        <button onClick={add} style={{ padding: "0 18px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", fontWeight: 800 }}>Add</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {["stocks", "crypto", "polymarket"].map((k) => (
          <div key={k} style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{k}</div>

            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Manual</div>
            {(data.manual?.[k] || []).map((item) => (
              <div key={`m-${k}-${item}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, background: "#111827", borderRadius: 10, padding: 10 }}>
                <span>{item}</span>
                <button onClick={() => removeItem(k, item)} style={{ background: "transparent", color: "#fff", border: "none", cursor: "pointer" }}>✖</button>
              </div>
            ))}

            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 12, marginBottom: 6 }}>Auto</div>
            {(data.auto?.[k] || []).map((item) => (
              <div key={`a-${k}-${item}`} style={{ marginBottom: 8, background: "#111827", borderRadius: 10, padding: 10 }}>
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}