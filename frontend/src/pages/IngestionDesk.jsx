import React, { useEffect, useState } from "react";

export default function IngestionDesk() {
  const [items, setItems] = useState([]);
  const [watchlists, setWatchlists] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({
    title: "Urgent oil shipping route disruption raises macro risk",
    summary: "Public reporting suggests route disruption with spillover into energy and logistics.",
    source: "reuters",
    category: "geopolitics",
    urgency: "high",
    region: "Middle East",
    linked_symbols: "USO,XLE,LNG",
    linked_prediction_markets: "Oil above threshold this month?",
  });

  const load = async () => {
    const [recentRes, watchRes, candRes] = await Promise.all([
      fetch("/api/woi/ingestion/recent"),
      fetch("/api/woi/ingestion/watchlists"),
      fetch("/api/woi/ingestion/strategy-candidates"),
    ]);
    const recent = await recentRes.json();
    const watch = await watchRes.json();
    const cand = await candRes.json();
    setItems(recent.items || []);
    setWatchlists(watch);
    setCandidates(cand.items || []);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  const submit = async () => {
    await fetch("/api/woi/ingestion/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        linked_symbols: form.linked_symbols.split(",").map(s => s.trim()).filter(Boolean),
        linked_prediction_markets: form.linked_prediction_markets.split(",").map(s => s.trim()).filter(Boolean),
      }),
    });
    load();
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🛰️ Ingestion Desk</div>
        <div style={{ opacity: 0.8 }}>
          Real ingestion scaffolding • credibility • dedupe • Discord routing • watchlist injection
        </div>
      </div>

      <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: 10 }}>
        {Object.entries(form).map(([k, v]) => (
          <input
            key={k}
            value={v}
            onChange={(e) => setForm(prev => ({ ...prev, [k]: e.target.value }))}
            placeholder={k}
            style={{ padding: 12, borderRadius: 12, background: "#111827", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        ))}
        <button
          onClick={submit}
          style={{ padding: 12, borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", fontWeight: 800, cursor: "pointer" }}
        >
          Ingest Event
        </button>
      </div>

      {watchlists && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div style={{ background: "#111827", borderRadius: 16, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>📈 Stocks Watch</div>
            <div style={{ marginTop: 8 }}>{(watchlists.merged?.stocks || []).join(", ")}</div>
          </div>
          <div style={{ background: "#111827", borderRadius: 16, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>🪙 Crypto Watch</div>
            <div style={{ marginTop: 8 }}>{(watchlists.merged?.crypto || []).join(", ")}</div>
          </div>
          <div style={{ background: "#111827", borderRadius: 16, padding: 14 }}>
            <div style={{ fontWeight: 800 }}>🎯 Polymarket Watch</div>
            <div style={{ marginTop: 8 }}>{(watchlists.merged?.polymarket || []).join(", ")}</div>
          </div>
        </div>
      )}

      <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>🧪 Strategy Candidates</div>
        <div style={{ display: "grid", gap: 10 }}>
          {candidates.map((item) => (
            <div key={item.candidate_id} style={{ background: "#111827", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>{item.summary}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                🔗 {(item.linked_symbols || []).join(", ")} • 🎯 {(item.linked_prediction_markets || []).join(", ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div key={item.event_id} style={{ background: "#111827", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 800 }}>{item.title}</div>
              <div style={{ opacity: 0.8 }}>{item.urgency}</div>
            </div>
            <div style={{ marginTop: 8, opacity: 0.85 }}>{item.summary}</div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.72 }}>
              📰 {item.source} • credibility {item.credibility_score} • {item.category} • {item.region}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.72 }}>
              🔗 {(item.linked_symbols || []).join(", ") || "—"}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.72 }}>
              🧠 memory: {String(item.promotion?.promote_memory)} • 🧪 strategy: {String(item.promotion?.promote_strategy)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}