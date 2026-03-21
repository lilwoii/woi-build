import React from "react";

const SUIT_COLOR = (s) => (s === "♥" || s === "♦" ? "#ff6b6b" : "rgba(240,245,250,0.95)");

export default function Card({ rank="A", suit="♠", faceDown=false }) {
  const bg = faceDown
    ? "linear-gradient(135deg, rgba(120,255,210,0.20), rgba(255,255,255,0.06))"
    : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(235,240,245,0.92))";

  return (
    <div style={{
      width:74,height:108,borderRadius:14,
      border:"1px solid rgba(0,0,0,0.12)",
      boxShadow:"0 10px 24px rgba(0,0,0,0.30)",
      background:bg,position:"relative",overflow:"hidden"
    }}>
      {faceDown ? (
        <>
          <div style={{ position:"absolute", inset:10, borderRadius:12, border:"1px dashed rgba(0,0,0,0.25)" }} />
          <div style={{ position:"absolute", inset:0, opacity:0.35, background:"radial-gradient(circle at 30% 20%, rgba(255,255,255,0.7), rgba(255,255,255,0) 45%)" }} />
          <div style={{ position:"absolute", bottom:10, right:10, fontWeight:1000, color:"rgba(0,0,0,0.35)" }}>WOI</div>
        </>
      ) : (
        <>
          <div style={{ position:"absolute", top:10, left:10, display:"flex", flexDirection:"column", gap:2 }}>
            <div style={{ fontWeight:1100, fontSize:16, color:SUIT_COLOR(suit) }}>{rank}</div>
            <div style={{ fontWeight:1000, fontSize:16, color:SUIT_COLOR(suit) }}>{suit}</div>
          </div>

          <div style={{ position:"absolute", bottom:10, right:10, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, transform:"rotate(180deg)" }}>
            <div style={{ fontWeight:1100, fontSize:16, color:SUIT_COLOR(suit) }}>{rank}</div>
            <div style={{ fontWeight:1000, fontSize:16, color:SUIT_COLOR(suit) }}>{suit}</div>
          </div>

          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:34, fontWeight:1200,
            color:SUIT_COLOR(suit), opacity:0.9
          }}>{suit}</div>

          <div style={{ position:"absolute", inset:0, opacity:0.10, background:"radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9), rgba(255,255,255,0) 55%)" }} />
        </>
      )}
    </div>
  );
}
