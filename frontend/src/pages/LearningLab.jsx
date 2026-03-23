import React, { useState } from "react";

export default function LearningLab() {
  const [regime, setRegime] = useState(null);
  const [review, setReview] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [lessons, setLessons] = useState(null);

  const detectRegime = async () => {
    const res = await fetch("/api/woi/learning/regime/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market_stress: 0.82, inflation_pressure: true, trend: "downtrend", volatility_score: 0.75 }),
    });
    setRegime(await res.json());
  };

  const reviewStrategy = async () => {
    const res = await fetch("/api/woi/learning/strategy/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ win_rate: 0.61, pnl_pct: 8.2, drawdown_pct: 3.4, trades: 18 }),
    });
    setReview(await res.json());
  };

  const observePattern = async () => {
    await fetch("/api/woi/learning/patterns/observe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "cpi-fade-semiconductor-reclaim", symbol: "QQQ", regime: "risk-on-trend", outcome: "win", score: 0.74, notes: "QQQ reclaimed cleanly after CPI fear faded." }),
    });
    const res = await fetch("/api/woi/learning/patterns/recurring");
    setPatterns(await res.json());
  };

  const promoteLesson = async () => {
    await fetch("/api/woi/learning/lessons/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "QQQ CPI reclaim lesson", rule: "When CPI fear fades and semis lead, prefer long continuation setups.", symbol: "QQQ", regime: "risk-on-trend", confidence: 0.72, win_rate_hint: 0.63 }),
    });
    const res = await fetch("/api/woi/learning/lessons");
    setLessons(await res.json());
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🧠 Learning Lab</div>
        <div style={{ opacity: 0.8 }}>
          Regime detection • recurring patterns • lesson promotion • strategy self-review
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={detectRegime} style={{ padding: "10px 16px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Detect Regime</button>
        <button onClick={reviewStrategy} style={{ padding: "10px 16px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Review Strategy</button>
        <button onClick={observePattern} style={{ padding: "10px 16px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Observe Pattern</button>
        <button onClick={promoteLesson} style={{ padding: "10px 16px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Promote Lesson</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Regime / Review</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({ regime, review }, null, 2)}</pre>
        </div>

        <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Patterns / Lessons</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({ patterns, lessons }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}