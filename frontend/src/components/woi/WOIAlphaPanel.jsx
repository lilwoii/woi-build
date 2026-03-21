import React, { useEffect, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiAlpha.css";
import "./woiPolish.css";

export default function WOIAlphaPanel() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentUrl, setSentUrl] = useState("https://news.ycombinator.com/");

  const refresh = async () => {
    try {
      const s = await woiApi.alphaStatus();
      setStatus(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { refresh(); }, []);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); await refresh(); }
  };

  const mode = status?.mode || "—";
  const running = !!status?.running;

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div className="woi-alpha-wrap">
        <div className="woi-alpha-row" style={{ justifyContent: "space-between" }}>
          <div style={{ fontWeight: 1000, letterSpacing: 1 }}>🧠 Alpha Engine</div>
          <div className="woi-alpha-row">
            <span className="woi-alpha-pill">{running ? "🟩 RUNNING" : "🟥 STOPPED"}</span>
            <span className="woi-alpha-pill">Mode: {mode}</span>
            <span className="woi-alpha-pill">Tick: {status?.tick ?? "—"}</span>
          </div>
        </div>

        <div className="woi-alpha-row">
          <button className="woi-btn" disabled={busy} onClick={() => run(() => woiApi.alphaStart())}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,255,200,0.22)", background:"rgba(0,255,200,0.10)", color:"rgba(220,255,248,0.95)", fontWeight:1000, cursor:"pointer" }}>
            ▶️ Start
          </button>
          <button className="woi-btn" disabled={busy} onClick={() => run(() => woiApi.alphaStop())}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,120,120,0.28)", background:"rgba(255,120,120,0.08)", color:"rgba(255,230,230,0.95)", fontWeight:1000, cursor:"pointer" }}>
            🛑 Stop
          </button>
          <button className="woi-btn" disabled={busy} onClick={() => run(() => woiApi.alphaReseed())}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            🔁 Reseed priors
          </button>
          <button className="woi-btn" disabled={busy} onClick={() => run(() => woiApi.alphaStrategies())}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            🧩 List strategies
          </button>
          <button className="woi-btn" disabled={busy} onClick={() => run(() => woiApi.alphaScorecards())}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            📊 Scorecards
          </button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.88, marginTop: 6 }}>📰 Sentiment + OpenBB intel controls</div>
        <div className="woi-alpha-row">
          <input value={sentUrl} onChange={(e)=>setSentUrl(e.target.value)} placeholder="https://..."
            style={{ flex: 1, minWidth: 260, padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.20)", color:"rgba(240,255,250,0.95)" }} />
          <button className="woi-btn" disabled={busy || !sentUrl.trim()} onClick={() => run(() => woiApi.sentimentEnqueue(sentUrl.trim()))}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(0,255,200,0.22)", background:"rgba(0,255,200,0.10)", color:"rgba(220,255,248,0.95)", fontWeight:1000, cursor:"pointer" }}>
            ➕ Enqueue feed
          </button>
          <button className="woi-btn" disabled={busy} onClick={() => run(() => woiApi.openbbRun())}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            📉 Run OpenBB
          </button>
        </div>

        <div style={{ fontSize: 12, opacity: 0.78 }}>
          Logs: Discord will show emoji+color-coded embeds for every alpha decision and failure.
        </div>
      </div>
    </div>
  );
}
