import React, { useState } from "react";
import BlackjackTable from "./casino/BlackjackTable";
import RouletteTable from "./casino/RouletteTable";
import { API_BASE_URL } from "../config";
import "./casino/casino.css";

export default function CasinoSim() {
  const [tab, setTab] = useState("blackjack");
  const [logs, setLogs] = useState([]);

  const pushLogLocal = (message, payload={}) => {
    const item = { ts: new Date().toISOString(), message, payload };
    setLogs((prev)=>[item, ...prev].slice(0, 80));
  };

  const pushLog = async (game, action, meta={}) => {
    pushLogLocal(`${game}: ${action}`, meta);
    try {
      await fetch(`${API_BASE_URL}/api/woi/casino/log`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ game, action, meta })
      });
    } catch {}
  };

  return (
    <div className="casino-shell">
      <div className="casino-hero fade-in">
        <div className="casino-title">
          <h2>🎰 Casino Sim</h2>
          <div className="casino-row">
            <button className={`casino-tab ${tab==="blackjack"?"active":""}`} onClick={()=>setTab("blackjack")}>♠️ Blackjack</button>
            <button className={`casino-tab ${tab==="roulette"?"active":""}`} onClick={()=>setTab("roulette")}>🎡 Roulette</button>
          </div>
        </div>
        <div className="casino-sub">Visual sim UI + Discord logs + stats memory.</div>
      </div>

      {tab==="blackjack"
        ? <BlackjackTable onLog={(m,p)=>pushLog("blackjack", m, p)} />
        : <RouletteTable onLog={(m,p)=>pushLog("roulette", m, p)} />
      }

      <div className="casino-card fade-in">
        <div className="casino-title">
          <h2>🧾 Session Logs</h2>
          <div className="casino-sub">Local logs mirror to Discord via backend webhook.</div>
        </div>

        <div style={{ marginTop:12, maxHeight:260, overflow:"auto", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
          {logs.length===0 ? (
            <div style={{ padding:14, opacity:0.65, fontSize:12 }}>No logs yet. Play a hand or spin roulette.</div>
          ) : (
            logs.map((l, idx)=>(
              <div key={idx} style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:12, display:"flex", gap:10 }}>
                <div style={{ opacity:0.65, minWidth:108 }}>{l.ts.slice(11,19)}</div>
                <div style={{ fontWeight:900 }}>{l.message}</div>
                <div style={{ opacity:0.7, marginLeft:"auto" }}>{Object.keys(l.payload||{}).length ? JSON.stringify(l.payload).slice(0,90) : ""}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
