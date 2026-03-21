import React from "react";

export default function GlobeTicker({ items=[] }) {
  const safe = items.length ? items : [
    { severity:"high", title:"The main news of this hour", delta:"+3.1%" },
    { severity:"critical", title:"Murky outlook after tariff headlines", delta:"+4.3%" },
    { severity:"low", title:"Hello! Markets steady", delta:"+0.4%" },
  ];
  const doubled = [...safe, ...safe];

  const pill = (s)=>(
    <span className={`gl-pill ${s==="critical"?"bad":(s==="high"?"good":"")}`}>
      {String(s||"low").toUpperCase()}
    </span>
  );

  return (
    <div className="gl-ticker">
      <div className="gl-ticker-inner">
        {doubled.map((it, idx)=>(
          <div key={idx} className="gl-row">
            {pill(it.severity)}
            <div style={{ fontSize:12, fontWeight:1000 }}>{it.title}</div>
            <div style={{ fontSize:12, opacity:0.75 }}>{it.delta||""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
