import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../config";

// ✅ SAFE IMPLEMENTATION
// This module provides:
// 1) A casino *simulation* (blackjack / roulette) so users can see “how it would look”.
// 2) A “Coach mode” where users can enter their hand / spin info and get advice.
//
// ❌ Not included (by design): screen-reading / automating real-money casino sites.

const cardStyle = {
  borderRadius: 16,
  border: "1px solid #111827",
  background: "radial-gradient(circle at top left, #020617, #020617 40%, #020617)",
  padding: "12px 14px",
};

const pill = (active) => ({
  padding: "6px 12px",
  borderRadius: 999,
  border: active ? "1px solid #38bdf8" : "1px solid #111827",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: 12,
  cursor: "pointer",
  boxShadow: active ? "0 0 0 1px rgba(56, 189, 248, 0.45)" : "none",
});

const smallBtn = (tone = "blue") => {
  const map = {
    blue: { border: "1px solid #38bdf8", color: "#e5e7eb", background: "#020617" },
    green: { border: "1px solid #16a34a", color: "#0b1120", background: "#22c55e" },
    red: { border: "1px solid #b91c1c", color: "#f9fafb", background: "#b91c1c" },
    gray: { border: "1px solid #1f2933", color: "#e5e7eb", background: "#020617" },
  };
  const c = map[tone] || map.blue;
  return {
    ...c,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
};

const fmt = (n) => (typeof n === "number" ? n.toFixed(2) : "—");

export default function Casino() {
  const [tab, setTab] = useState("sim"); // sim | coach
  const [game, setGame] = useState("blackjack"); // blackjack | roulette | horse
  const [sendDiscord, setSendDiscord] = useState(false);

  // SIM config
  const [bankroll, setBankroll] = useState(500);
  const [unit, setUnit] = useState(10);
  const [risk, setRisk] = useState("balanced"); // conservative | balanced | aggressive

  // status
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const pollRef = useRef(null);

  // Coach
  const [coachInput, setCoachInput] = useState("");
  const [coachOut, setCoachOut] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const streakEmoji = useMemo(() => {
    if (!status?.streak || status?.streak <= 0) return "🧊";
    if (status.streak >= 10) return "🔥";
    return "✨";
  }, [status]);

  const startSim = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/casino/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          bankroll: Number(bankroll),
          unit: Number(unit),
          risk,
          send_to_discord: !!sendDiscord,
        }),
      });
      if (!res.ok) throw new Error("start failed");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
      alert("Failed to start casino sim. Check backend logs.");
    }
  };

  const stopSim = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/casino/stop`, { method: "POST" });
      if (!res.ok) throw new Error("stop failed");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
      alert("Failed to stop sim.");
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/casino/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askCoach = async () => {
    if (!coachInput.trim()) return;
    setCoachLoading(true);
    setCoachOut(null);
    try {
      const res = await fetch(`${API_BASE_URL}/casino/coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, input: coachInput.trim() }),
      });
      const data = await res.json();
      setCoachOut({ ...data, summary: data.summary || data.advice || data.recommendation || "" });
    } catch (e) {
      console.error(e);
      setCoachOut({ ok: false, summary: "Coach error. Check backend logs." });
    } finally {
      setCoachLoading(false);
    }
  };

  const running = !!status?.running;
  const phase = status?.phase || "idle";
  const phaseColor =
    phase === "running" ? "#22c55e" : phase === "queued" ? "#eab308" : phase === "failed" ? "#ef4444" : "#94a3b8";

  return (
    <div style={{ padding: 16, color: "#e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎰 Casino Lab</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            Simulation + coach tools (no real-money site automation).
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: phaseColor }} />
            <span style={{ color: "#cbd5e1" }}>{loadingStatus ? "sync…" : phase}</span>
          </div>
          <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }} title="Win streak">
            <span>{streakEmoji}</span>
            <span style={{ fontWeight: 800 }}>{status?.streak ?? 0}</span>
          </div>
          <button onClick={fetchStatus} style={smallBtn("gray")}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        {/* Left: control + logs */}
        <div style={{ ...cardStyle, minHeight: 420 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setTab("sim")} style={pill(tab === "sim")}>🧪 Simulator</button>
            <button onClick={() => setTab("coach")} style={pill(tab === "coach")}>🧠 Coach</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={() => setGame("blackjack")} style={pill(game === "blackjack")}>🂡 Blackjack</button>
            <button onClick={() => setGame("roulette")} style={pill(game === "roulette")}>🎯 Roulette</button>
            <button onClick={() => setGame("horse")} style={pill(game === "horse")}>🐎 Horse Racing</button>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginLeft: "auto" }}>
              <input type="checkbox" checked={sendDiscord} onChange={(e) => setSendDiscord(e.target.checked)} />
              <span>Send results to Discord</span>
            </label>
          </div>

          {tab === "sim" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Bankroll</div>
                  <input
                    value={bankroll}
                    onChange={(e) => setBankroll(e.target.value)}
                    type="number"
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #1f2933", background: "#020617", color: "#e5e7eb", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Unit size</div>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    type="number"
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #1f2933", background: "#020617", color: "#e5e7eb", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Risk</div>
                  <select
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                    style={{ width: "100%", borderRadius: 12, border: "1px solid #1f2933", background: "#020617", color: "#e5e7eb", padding: "8px 10px" }}
                  >
                    <option value="conservative">🧊 Conservative</option>
                    <option value="balanced">✨ Balanced</option>
                    <option value="aggressive">🔥 Aggressive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={startSim} disabled={running} style={{ ...smallBtn("green"), opacity: running ? 0.6 : 1 }}>
                  ▶ Start
                </button>
                <button onClick={stopSim} disabled={!running} style={{ ...smallBtn("red"), opacity: !running ? 0.6 : 1 }}>
                  ■ Stop
                </button>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8" }}>
                  <span>Queue:</span>
                  <span style={{ color: "#e5e7eb", fontWeight: 800 }}>{status?.queue_depth ?? 0}</span>
                </div>
              </div>

              {/* Live progress strip */}
              <div style={{ border: "1px solid #111827", borderRadius: 14, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {running ? "Running" : "Idle"} {game === "blackjack" ? "🂡" : game === "roulette" ? "🎯" : "🐎"}
                  </div>
                  <div style={{ fontSize: 12, color: phaseColor, fontWeight: 800 }}>{phase}</div>
                </div>
                <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: "#0b1220", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: running ? "66%" : phase === "queued" ? "33%" : "6%",
                      background: "linear-gradient(90deg, #22c55e, #0ea5e9, #6366f1)",
                      borderRadius: 999,
                      animation: running ? "pulse 1.2s ease-in-out infinite" : "none",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                  Simulated progress bar (real-time systems don’t expose exact EV progress). Status events are real: queued / started / paused / stopped / failed.
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Live log</div>
                <div style={{ maxHeight: 200, overflowY: "auto", paddingRight: 6, fontSize: 12 }}>
                  {(status?.logs || []).length === 0 && <div style={{ opacity: 0.6 }}>No log yet. Start the sim.</div>}
                  {(status?.logs || []).map((l, idx) => (
                    <div key={idx} style={{ padding: "6px 0", borderBottom: "1px dashed #111827" }}>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                Paste a quick description and the coach will reply fast.
                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  <strong>Blackjack examples:</strong> “Me: 16 vs dealer 10”, “Me: 9 vs 3 (can double)”, “Me: A,7 vs 9”.
                </div>
                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  <strong>Roulette examples:</strong> “Last spins: 32R, 15B, 0G. bankroll 200. Pick next bet.”
                </div>
              </div>

              <textarea
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                rows={6}
                placeholder={game === "blackjack" ? "Me: 16 vs dealer 10" : "Last spins: ..."}
                style={{ width: "100%", borderRadius: 14, border: "1px solid #1f2933", background: "#020617", color: "#e5e7eb", padding: 10, outline: "none" }}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={askCoach} disabled={coachLoading} style={{ ...smallBtn("blue"), opacity: coachLoading ? 0.6 : 1 }}>
                  {coachLoading ? "Thinking…" : "Ask Coach"}
                </button>
                <button onClick={() => { setCoachInput(""); setCoachOut(null); }} style={smallBtn("gray")}>
                  Clear
                </button>
              </div>

              <div style={{ marginTop: 12, fontSize: 12 }}>
                {!coachOut && <div style={{ opacity: 0.6 }}>No answer yet.</div>}
                {coachOut && (
                  <div style={{ border: "1px solid #111827", borderRadius: 14, padding: "10px 12px" }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                      {coachOut.ok ? "✅ Recommendation" : "⚠️"}
                    </div>
                    <div>{coachOut.summary}</div>
                    {coachOut.detail && (
                      <div style={{ marginTop: 8, color: "#94a3b8" }}>{coachOut.detail}</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: KPIs */}
        <div style={{ ...cardStyle, minHeight: 420 }}>
          <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            KPI Strip
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ border: "1px solid #111827", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Bankroll</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>${fmt(status?.bankroll)}</div>
            </div>
            <div style={{ border: "1px solid #111827", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>P/L</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: (status?.pnl ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                {status?.pnl != null ? `${status.pnl >= 0 ? "+" : ""}${fmt(status.pnl)}` : "—"}
              </div>
            </div>
            <div style={{ border: "1px solid #111827", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Hands / spins</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{status?.rounds ?? 0}</div>
            </div>
            <div style={{ border: "1px solid #111827", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Win rate</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{status?.win_rate != null ? `${(status.win_rate * 100).toFixed(1)}%` : "—"}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
            Notes:
            <ul style={{ marginTop: 6 }}>
              <li>Simulation uses simple heuristics (not a promise of profitability).</li>
              <li>Coach gives suggestions based on known strategies; always double-check house rules.</li>
              <li>Discord output is optional and emoji-coded.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { filter: brightness(1.0); transform: translateX(0); }
          50% { filter: brightness(1.25); transform: translateX(4px); }
          100% { filter: brightness(1.0); transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}