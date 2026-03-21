import React from "react";

export default function GlobeLegend({ regionFilter, setRegionFilter, tension, counts, topRegions=[] }) {
  const clear = ()=> setRegionFilter?.("");

  const pill = (label, cls)=>(
    <span className={`gl-pill ${cls||""}`} style={{ cursor: regionFilter ? "pointer":"default" }} onClick={regionFilter ? clear : undefined}>
      {label}
    </span>
  );

  return (
    <div className="gl-legend">
      <div className="gl-row" style={{ justifyContent:"space-between" }}>
        <div style={{ fontWeight:1200 }}>🧭 Legend</div>
        {regionFilter ? <button className="gl-btn" onClick={clear} style={{ padding:"7px 10px" }}>Clear Filter ✕</button> : null}
      </div>

      <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
        {pill("HIGH VOL", "good")}
        {pill("MID VOL", "")}
        {pill("LOW VOL", "")}
        <span className={`gl-pill ${(tension?.label==="high"||tension?.label==="severe")?"bad":(tension?.label==="elevated"?"good":"")}`}>
          🌐 Tension {tension?.score ?? 0}
        </span>
        <span className="gl-pill">🔴 {counts?.critical ?? 0}</span>
        <span className="gl-pill">🟢 {counts?.high ?? 0}</span>
        <span className="gl-pill">⚪ {counts?.low ?? 0}</span>
      </div>

      {topRegions.length ? (
        <>
          <div style={{ marginTop:10 }} className="gl-mini">Top volume regions (click to filter)</div>
          <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
            {topRegions.slice(0,8).map((r, i)=>(
              <button
                key={i}
                className={`gl-chip-btn ${regionFilter===r.name?"active":""}`}
                onClick={()=>setRegionFilter?.(r.name)}
                title={`volume ${r.v}`}
              >
                {r.tier} • {r.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {regionFilter ? (
        <div style={{ marginTop:10 }} className="gl-mini">
          🔎 Filtering feed by: <b>{regionFilter}</b>
        </div>
      ) : (
        <div style={{ marginTop:10 }} className="gl-mini">
          Tip: click any volume label on the globe to filter the feed instantly.
        </div>
      )}
    </div>
  );
}
