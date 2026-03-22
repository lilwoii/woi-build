import React, { useState } from "react";

function makeSampleCandles() {
  return [
    { open: 100, high: 102, low: 99, close: 101 },
    { open: 101, high: 103, low: 100, close: 102 },
    { open: 102, high: 104, low: 101, close: 103 },
    { open: 103, high: 105, low: 102, close: 104 },
    { open: 104, high: 106, low: 103, close: 105 },
    { open: 105, high: 106, low: 104, close: 104.5 },
    { open: 104.5, high: 107, low: 104, close: 106 },
    { open: 106, high: 108, low: 105, close: 107 },
    { open: 107, high: 109, low: 106, close: 108.2 },
    { open: 108.2, high: 110, low: 107.8, close: 109.5 },
  ];
}

export default function ChartIntel() {
  const [symbol, setSymbol] = useState("SPY");
  const [analysis, setAnalysis] = useState(null);
  const [routing, setRouting] = useState(null);

  const run = async () => {
    const candles = makeSampleCandles();
    const res = await fetch("/api/woi/chart/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, candles }),
    });
    const data = await res.json();
    setAnalysis(data);

    const routeRes = await fetch("/api/woi/chart/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const routeData = await routeRes.json();
    setRouting(routeData);
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>📊 Chart Intelligence</div>
        <div style={{ opacity: 0.8 }}>
          Auto trend lines • support/resistance • Fibonacci • pattern detection • confluence routing
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} style={{ padding: 12, borderRadius: 12, background: "#111827", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }} />
        <button onClick={run} style={{ padding: "0 18px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", fontWeight: 800 }}>
          Analyze
        </button>
      </div>

      {analysis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>🧠 Summary</div>
            <div>{analysis.summary}</div>

            <div style={{ marginTop: 12, fontSize: 14 }}>Trend: {analysis.trend}</div>
            <div>Confluence: {analysis.confluence_score}</div>

            <div style={{ marginTop: 12, fontWeight: 700 }}>Trendlines</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(analysis.trendlines, null, 2)}</pre>
          </div>

          <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>📐 Levels / Patterns</div>
            <div style={{ marginTop: 10, fontWeight: 700 }}>Support / Resistance</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(analysis.support_resistance, null, 2)}</pre>

            <div style={{ marginTop: 10, fontWeight: 700 }}>Fibonacci</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(analysis.fibonacci, null, 2)}</pre>

            <div style={{ marginTop: 10, fontWeight: 700 }}>Patterns</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(analysis.patterns, null, 2)}</pre>
          </div>
        </div>
      )}

      {routing && (
        <div style={{ background: "#111827", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>🧭 Automated Symbol Routing</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(routing, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}