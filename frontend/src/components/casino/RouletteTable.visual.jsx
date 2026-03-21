import React, { useState } from "react";
import RouletteWheel from "./RouletteWheel";
import "./casino.css";
import { API_BASE_URL } from "../../config";

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const isRed = (n)=>RED.has(n);
const randInt = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;

export default function RouletteTableVisual({ onLog }) {
  const [bankroll, setBankroll] = useState(1000);
  const [betAmt, setBetAmt] = useState(10);
  const [betType, setBetType] = useState("red");
  const [numberPick, setNumberPick] = useState(7);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const log = (m,p={})=>onLog?.(m,p);
  const payout = betType==="number" ? 35 : 1;

  const postStats = async (win, bet, delta, bet_type) => {
    try {
      await fetch(`${API_BASE_URL}/api/woi/casino/roulette/result`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ win, bet, delta, bet_type })
      });
    } catch {}
  };

  const spin = ()=>{
    if (betAmt<=0 || betAmt>bankroll) return;
    setSpinning(true);
    const n = randInt(0,36);
    setResult({ n, ts: Date.now() });
    log("🎡 SPIN",{ betType, betAmt, pick: betType==="number"?numberPick:null });

    setTimeout(async ()=>{
      setSpinning(false);
      let win=false;
      if (betType==="red") win = n!==0 && isRed(n);
      if (betType==="black") win = n!==0 && !isRed(n);
      if (betType==="even") win = n!==0 && n%2===0;
      if (betType==="odd") win = n%2===1;
      if (betType==="number") win = n===numberPick;

      const delta = win ? betAmt*payout : -betAmt;
      const next = bankroll + delta;
      setBankroll(next);
      log(win?"🟩 WIN":"🟥 LOSE",{ n, delta, bankroll: next });
      await postStats(win, betAmt, delta, betType);
    }, 2300);
  };

  const pill=(t,k="neutral")=><span className={`casino-pill ${k}`}>{t}</span>;
  const resKind = (n)=> n==null ? "neutral" : (n===0 ? "good" : (isRed(n) ? "bad" : "neutral"));

  return (
    <div className="casino-card fade-in">
      <div className="casino-title">
        <h2>🎡 Roulette (Visual Sim)</h2>
        <div className="casino-row">
          {pill(`Bankroll: $${bankroll.toFixed(0)}`,"good")}
          {pill(`Bet: $${betAmt}`,"neutral")}
          {result?.n!=null && pill(`Result: ${result.n}`, resKind(result.n))}
        </div>
      </div>

      <div className="casino-grid" style={{ marginTop:14 }}>
        <div className="casino-card" style={{ background:"rgba(6,10,14,0.55)" }}>
          <div style={{ display:"flex", justifyContent:"center" }}>
            <RouletteWheel resultNumber={result?.n ?? 0} spinning={spinning} />
          </div>
          <div style={{ marginTop:14, display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap" }}>
            <button className="casino-btn primary" onClick={spin} disabled={spinning}>🎡 Spin</button>
            <button className="casino-btn" onClick={()=>setBetAmt(Math.min(bankroll, betAmt+5))} disabled={spinning}>+5</button>
            <button className="casino-btn" onClick={()=>setBetAmt(Math.max(1, betAmt-5))} disabled={spinning}>-5</button>
          </div>
        </div>

        <div className="casino-card" style={{ background:"rgba(6,10,14,0.55)" }}>
          <div style={{ fontWeight:1000, marginBottom:10 }}>🎯 Bet</div>
          <div className="casino-row" style={{ marginBottom:10 }}>
            <button className={`casino-tab ${betType==="red"?"active":""}`} onClick={()=>setBetType("red")} disabled={spinning}>🟥 Red</button>
            <button className={`casino-tab ${betType==="black"?"active":""}`} onClick={()=>setBetType("black")} disabled={spinning}>⬛ Black</button>
            <button className={`casino-tab ${betType==="even"?"active":""}`} onClick={()=>setBetType("even")} disabled={spinning}>➗ Even</button>
            <button className={`casino-tab ${betType==="odd"?"active":""}`} onClick={()=>setBetType("odd")} disabled={spinning}>➕ Odd</button>
            <button className={`casino-tab ${betType==="number"?"active":""}`} onClick={()=>setBetType("number")} disabled={spinning}># Number</button>
          </div>

          {betType==="number" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:8 }}>
              {Array.from({length:37}).map((_,i)=>(
                <button key={i} className="casino-btn" onClick={()=>setNumberPick(i)} disabled={spinning}
                  style={{
                    padding:"10px 0",
                    borderColor: numberPick===i ? "rgba(120,255,210,0.45)" : "rgba(255,255,255,0.08)",
                    background: numberPick===i ? "rgba(120,255,210,0.14)" : "rgba(255,255,255,0.04)"
                  }}
                >{i}</button>
              ))}
            </div>
          )}

          <div style={{ marginTop:12, fontSize:12, opacity:0.8 }}>
            Payout: <b>{betType==="number" ? "35:1" : "1:1"}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
