import React, { useState } from "react";

export default function OpsRouterBoard() {
  const [text, setText] = useState("");
  const [matched, setMatched] = useState(null);
  const [routed, setRouted] = useState(null);

  const runRouting = async () => {
    const cleaned = text.trim();
    if (!cleaned) return;

    const matchRes = await fetch("/api/woi/ops/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned }),
    });
    const matchData = await matchRes.json();
    setMatched(matchData);

    const routeRes = await fetch("/api/woi/ops/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: cleaned,
        category:
          cleaned.toLowerCase().includes("fed") || cleaned.toLowerCase().includes("cpi")
            ? "economy"
            : cleaned.toLowerCase().includes("flight") || cleaned.toLowerCase().includes("shipping")
            ? "transport"
            : "macro",
        urgency:
          cleaned.toLowerCase().includes("urgent") || cleaned.toLowerCase().includes("critical")
            ? "critical"
            : "high",
        market_impact_score:
          cleaned.toLowerCase().includes("oil") || cleaned.toLowerCase().includes("fed") ? 0.86 : 0.68,
        linked_symbols: matchData.linked_symbols || [],
        linked_prediction_markets: matchData.linked_prediction_markets || [],
      }),
    });
    const routeData = await routeRes.json();
    setRouted(routeData);
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🧭 Ops Router</div>
        <div style={{ opacity: 0.8 }}>
          Route events into macro desk, symbol watch, prediction desk, and shadow strategy candidates
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an event or headline... Example: Urgent oil shipping route disruption raises flight and maritime alerts."
          style={{
            minHeight: 120,
            borderRadius: 14,
            padding: 12,
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <button
          onClick={runRouting}
          style={{
            padding: "0 18px",
            borderRadius: 14,
            background: "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Route
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>🔗 Match Results</div>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, opacity: 0.9 }}>
            {matched ? JSON.stringify(matched, null, 2) : "No match yet."}
          </pre>
        </div>

        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>🧪 Route Results</div>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, opacity: 0.9 }}>
            {routed ? JSON.stringify(routed, null, 2) : "No route yet."}
          </pre>
        </div>
      </div>
    </div>
  );
}