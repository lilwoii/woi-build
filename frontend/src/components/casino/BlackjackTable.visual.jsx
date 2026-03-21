import React, { useMemo, useState } from "react";
import Card from "./Card";
import "./casino.css";
import { API_BASE_URL } from "../../config";

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const rand = (a)=>a[Math.floor(Math.random()*a.length)];
const drawCard = ()=>({ rank: rand(RANKS), suit: rand(SUITS) });

function value(card){
  if (card.rank==="A") return 11;
  if (["K","Q","J"].includes(card.rank)) return 10;
  return Number(card.rank);
}
function handTotal(hand){
  let total = hand.reduce((s,c)=>s+value(c),0);
  let aces = hand.filter(c=>c.rank==="A").length;
  while(total>21 && aces>0){ total -= 10; aces -= 1; }
  return total;
}

export default function BlackjackTableVisual({ onLog }) {
  const [bet, setBet] = useState(10);
  const [bankroll, setBankroll] = useState(1000);
  const [phase, setPhase] = useState("idle");
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [result, setResult] = useState(null);

  const pTotal = useMemo(()=>handTotal(player), [player]);
  const dTotal = useMemo(()=>handTotal(dealer), [dealer]);

  const log = (m,p={})=>onLog?.(m,p);

  const postStats = async (outcome, betAmt, delta) => {
    try {
      await fetch(`${API_BASE_URL}/api/woi/casino/blackjack/result`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ result: outcome, bet: betAmt, delta })
      });
    } catch {}
  };

  const start = ()=>{
    if (bet<=0 || bet>bankroll) return;
    const p=[drawCard(), drawCard()];
    const d=[drawCard(), drawCard()];
    setPlayer(p); setDealer(d);
    setPhase("player"); setResult(null);
    log("🎴 DEAL",{bet, dealerShowing:`${d[0].rank}${d[0].suit}`});
  };

  const finish=async (outcome, reason)=>{
    setPhase("done");
    setResult({ outcome, reason });
    let delta=0;
    if (outcome==="win") delta=bet;
    if (outcome==="lose") delta=-bet;
    const next=bankroll+delta;
    setBankroll(next);
    log(`✅ ${outcome.toUpperCase()} (${reason})`,{bet, delta, bankroll:next});
    await postStats(outcome, bet, delta);
  };

  const hit=()=>{
    if (phase!=="player") return;
    const next=[...player, drawCard()];
    setPlayer(next);
    const t=handTotal(next);
    log("➕ HIT",{total:t});
    if (t>21) finish("lose","BUST");
  };

  const stand=()=>{
    if (phase!=="player") return;
    setPhase("dealer");
    let d=[...dealer];
    while(handTotal(d)<17) d=[...d, drawCard()];
    setDealer(d);
    const dt=handTotal(d);
    const pt=pTotal;
    if (dt>21) finish("win","DEALER BUST");
    else if (dt>pt) finish("lose","DEALER HIGH");
    else if (dt<pt) finish("win","PLAYER HIGH");
    else finish("push","PUSH");
  };

  const chip=(amt)=>(
    <button className="casino-btn" onClick={()=>setBet(Math.min(bankroll, Math.max(1, bet+amt)))} disabled={phase!=="idle"}>
      {amt>0?`+${amt}`:amt}
    </button>
  );
  const pill=(t,k="neutral")=><span className={`casino-pill ${k}`}>{t}</span>;

  return (
    <div className="casino-card fade-in">
      <div className="casino-title">
        <h2>♠️ Blackjack (Visual Sim)</h2>
        <div className="casino-row">
          {pill(`Bankroll: $${bankroll.toFixed(0)}`,"good")}
          {pill(`Bet: $${bet}`,"neutral")}
          {result?.outcome==="win" && pill("🟩 WIN","good")}
          {result?.outcome==="lose" && pill("🟥 LOSE","bad")}
          {result?.outcome==="push" && pill("🟨 PUSH","neutral")}
        </div>
      </div>

      <div style={{ marginTop:14, display:"grid", gap:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div className="casino-row">
            <button className="casino-btn primary" onClick={start} disabled={phase!=="idle"}>🎴 Deal</button>
            <button className="casino-btn" onClick={hit} disabled={phase!=="player"}>➕ Hit</button>
            <button className="casino-btn" onClick={stand} disabled={phase!=="player"}>✋ Stand</button>
          </div>
          <div className="casino-row">
            {chip(1)}{chip(5)}{chip(25)}{chip(100)}{chip(-1)}{chip(-5)}
          </div>
        </div>

        <div className="casino-grid">
          <div className="casino-card" style={{ background:"rgba(6,10,14,0.55)" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontWeight:1000 }}>🧑 Player</div>
              <div style={{ opacity:0.8, fontSize:12 }}>Total: <b>{player.length?pTotal:"-"}</b></div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
              {player.length? player.map((c,i)=>(<Card key={i} rank={c.rank} suit={c.suit} />)):<div style={{ opacity:0.6, fontSize:12 }}>No cards yet</div>}
            </div>
          </div>

          <div className="casino-card" style={{ background:"rgba(6,10,14,0.55)" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontWeight:1000 }}>🧑‍⚖️ Dealer</div>
              <div style={{ opacity:0.8, fontSize:12 }}>Total: <b>{dealer.length?(phase==="player"?"?":dTotal):"-"}</b></div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
              {dealer.length? dealer.map((c,i)=>(<Card key={i} rank={c.rank} suit={c.suit} faceDown={phase==="player" && i===1} />)):<div style={{ opacity:0.6, fontSize:12 }}>No cards yet</div>}
            </div>
          </div>
        </div>

        {result && (
          <div className="casino-card fade-in" style={{ background:"rgba(10,14,18,0.58)" }}>
            <div style={{ fontWeight:1000 }}>
              {result.outcome==="win"?"🟩 You win":result.outcome==="lose"?"🟥 You lose":"🟨 Push"} — {result.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
