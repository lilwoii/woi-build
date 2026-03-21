import React, { useEffect, useMemo, useState } from "react";

const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const colorFor = (n)=> n===0 ? "rgba(120,255,210,0.95)" : (RED.has(n) ? "rgba(255,90,90,0.92)" : "rgba(240,245,250,0.88)");

export default function RouletteWheel({ resultNumber, spinning }) {
  const [angle, setAngle] = useState(0);
  const idx = useMemo(()=> ORDER.indexOf(resultNumber ?? 0), [resultNumber]);
  const targetAngle = useMemo(()=>{
    const slot = 360 / ORDER.length;
    return -(idx * slot) + 360*6;
  }, [idx]);

  useEffect(()=>{
    if (resultNumber == null) return;
    if (!spinning) return;
    const t = setTimeout(()=> setAngle(targetAngle), 40);
    return ()=>clearTimeout(t);
  }, [resultNumber, spinning, targetAngle]);

  const slot = 360 / ORDER.length;

  return (
    <div style={{ position:"relative", width:320, height:320 }}>
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:"10px solid rgba(255,255,255,0.08)",
        boxShadow:"0 18px 50px rgba(0,0,0,0.55)",
        background:"radial-gradient(circle at 35% 30%, rgba(255,255,255,0.10), rgba(0,0,0,0.55) 65%)",
        overflow:"hidden"
      }}>
        <div style={{
          position:"absolute", inset:0,
          transform:`rotate(${angle}deg)`,
          transition: spinning ? "transform 2.2s cubic-bezier(.12,.72,.22,1)" : "none"
        }}>
          {ORDER.map((n,i)=>(
            <div key={n} style={{
              position:"absolute", left:"50%", top:"50%",
              width:"50%", height:2,
              transform:`rotate(${i*slot}deg)`, transformOrigin:"0 0"
            }}>
              <div style={{
                position:"absolute", right:4, top:-10,
                width:44, height:20,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:1000,
                borderRadius:999,
                background:"rgba(0,0,0,0.35)",
                border:"1px solid rgba(255,255,255,0.12)",
                color: colorFor(n)
              }}>{n}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position:"absolute", top:-8, left:"50%",
        transform:"translateX(-50%)",
        width:0, height:0,
        borderLeft:"12px solid transparent",
        borderRight:"12px solid transparent",
        borderBottom:"18px solid rgba(255,255,255,0.9)",
        filter:"drop-shadow(0 8px 10px rgba(0,0,0,0.45))"
      }}/>
      <div style={{
        position:"absolute", top:22, left:"50%",
        transform:"translateX(-50%)",
        width:12, height:12, borderRadius:"50%",
        background:"rgba(255,255,255,0.95)",
        boxShadow:"0 10px 18px rgba(0,0,0,0.55)"
      }}/>
    </div>
  );
}
