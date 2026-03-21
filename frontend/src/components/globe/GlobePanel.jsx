import React, { useMemo, useState } from "react";
import { basketize } from "./BasketsUtil";

const tone = (sev)=> sev==="critical" ? "bad" : (sev==="high" ? "good" : "");

export default function GlobePanel({
  tab, setTab, items, tension,
  onSelect, onClear, onRefresh,
  related, onWatch, onTrade,
  topicChips=[], categoryChips=[],
  regionFilter=""
}) {
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");
  const [flightFilter, setFlightFilter] = useState("all");
  const [minAlt, setMinAlt] = useState("");

  const regionNorm = (s)=>String(s||"").toLowerCase().trim();

  const filtered = useMemo(()=>{
    const qq = q.trim().toLowerCase();
    const rf = regionNorm(regionFilter);
    return (items||[]).filter(it=>{
      if (sev!=="all" && String(it.severity||"").toLowerCase()!==sev) return false;
      if (rf){
        const loc = `${it.location||""} ${it.meta?.region||""} ${it.meta?.country||""} ${it.meta?.state||""}`.toLowerCase();
        if (!loc.includes(rf)) return false;
      }
      if (!qq) return true;
      const hay = `${it.title||""} ${it.summary||""} ${it.source||""} ${it.location||""}`.toLowerCase();
      return hay.includes(qq);
    }).slice().reverse();
  }, [items, q, sev, regionFilter]);

  const flightRows = useMemo(()=>{
    const rows = (items||[])
      .filter(it => String(it.type||"").toLowerCase()==="flight")
      .map(it=>{
        const m = it.meta || {};
        return {
          it,
          aircraft: m.aircraft || m.callsign || "FLIGHT",
          alt: Number(m.altitude_ft || m.altitude || 0),
          origin: m.origin?.label || m.origin?.name || "",
          target: m.target?.label || m.target?.name || "",
        };
      })
      .sort((a,b)=> (b.it.ts_utc||"").localeCompare(a.it.ts_utc||""));
    return rows;
  }, [items]);

  const whaleRows = useMemo(()=>{
    const rows = (items||[])
      .filter(it => String(it.type||"").toLowerCase()==="whale")
      .map(it=>{
        const m = it.meta || {};
        return {
          it,
          usd: Number(m.usd || m.notional || m.volume || 0),
          origin: m.origin?.label || m.origin?.name || "origin",
          target: m.target?.label || m.target?.name || "target",
        };
      })
      .sort((a,b)=> (b.usd||0)-(a.usd||0));
    return rows.slice(0, 60);
  }, [items]);

  const baskets = useMemo(()=> basketize(related||[]), [related]);

  const TabBtn = ({ id, label }) => (
    <button className={`gl-tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}>{label}</button>
  );

  const tscore = tension?.score ?? 0;
  const tlabel = (tension?.label||"low").toUpperCase();

  return (
    <div className="gl-card">
      <div className="gl-topbar">
        <div style={{ fontWeight:1200 }}>📡 Feed</div>
        <div className="gl-row">
          <button className="gl-btn" onClick={onRefresh}>↻</button>
          <button className="gl-btn" onClick={onClear}>🧹</button>
        </div>
      </div>

      <div style={{ marginTop:10 }} className="gl-split">
        <div className="gl-kpi">
          <div className="label">Global tension index (24h)</div>
          <div className="value">{tscore}</div>
          <div className={`gl-pill ${tlabel==="SEVERE"||tlabel==="HIGH"?"bad":(tlabel==="ELEVATED"?"good":"")}`}>{tlabel}</div>
        </div>
        <div className="gl-kpi">
          <div className="label">Signals</div>
          <div className="value">{items?.length || 0}</div>
          <div className="gl-mini">{regionFilter ? `filter: ${regionFilter}` : "click a volume label to filter"}</div>
        </div>
      </div>

      <div style={{ marginTop:10 }} className="gl-side-tabs">
        <TabBtn id="feed" label="FEED" />
        <TabBtn id="whale" label="WHALE TRACKER" />
        <TabBtn id="flight" label="FLIGHTS" />
      </div>

      {(topicChips.length || categoryChips.length) ? (
        <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
          {topicChips.slice(0,6).map((t, i)=>(
            <span key={i} className="gl-chip">Topic: {t}</span>
          ))}
          {categoryChips.slice(0,6).map((c, i)=>(
            <span key={i} className="gl-chip">Cat: {c}</span>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop:10 }} className="gl-row">
        <input className="gl-input" placeholder="Search markets and events..." value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>

      <div style={{ marginTop:10 }} className="gl-row">
        <button className={`gl-tab ${sev==="all"?"active":""}`} onClick={()=>setSev("all")}>All</button>
        <button className={`gl-tab ${sev==="critical"?"active":""}`} onClick={()=>setSev("critical")}>Critical</button>
        <button className={`gl-tab ${sev==="high"?"active":""}`} onClick={()=>setSev("high")}>High</button>
        <button className={`gl-tab ${sev==="low"?"active":""}`} onClick={()=>setSev("low")}>Low</button>
      </div>

      {tab==="flight" ? (
        <div className="gl-list">
          <div style={{ padding:12, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="gl-row">
              <button className={`gl-tab ${flightFilter==="all"?"active":""}`} onClick={()=>setFlightFilter("all")}>All</button>
              <button className={`gl-tab ${flightFilter==="drone"?"active":""}`} onClick={()=>setFlightFilter("drone")}>Drone</button>
              <button className={`gl-tab ${flightFilter==="fighter"?"active":""}`} onClick={()=>setFlightFilter("fighter")}>Fighter</button>
              <input className="gl-input" style={{ maxWidth:130 }} value={minAlt} onChange={(e)=>setMinAlt(e.target.value)} placeholder="min alt ft" />
            </div>
          </div>

          {flightRows
            .filter(r=>{
              const a = String(r.aircraft||"").toLowerCase();
              if (flightFilter==="drone" && !a.includes("drone") && !a.includes("forte")) return false;
              if (flightFilter==="fighter" && !(a.includes("f-") || a.includes("fighter"))) return false;
              const ma = Number(minAlt||0);
              if (ma && r.alt < ma) return false;
              return true;
            })
            .slice(0, 90)
            .map((r, idx)=>(
            <div key={idx} className="gl-item" onClick={()=>onSelect?.(r.it)} style={{ cursor:"pointer" }}>
              <div style={{ minWidth:72, opacity:0.65, fontSize:11 }}>{(r.it.ts_utc||"").slice(11,19)}</div>
              <div style={{ width:"100%" }}>
                <div className="gl-row" style={{ justifyContent:"space-between" }}>
                  <div className="gl-title">✈ {r.aircraft}</div>
                  <span className={`gl-pill ${tone(String(r.it.severity||"").toLowerCase())}`}>{String(r.it.severity||"low").toUpperCase()}</span>
                </div>
                <div className="gl-sub">{r.origin} → {r.target} • {r.alt ? `${r.alt.toLocaleString()} ft` : "alt n/a"}</div>
                <div className="gl-mini">{r.it.summary || ""}</div>
              </div>
            </div>
          ))}
        </div>
      ) : tab==="whale" ? (
        <div className="gl-list">
          {whaleRows.map((r, idx)=>(
            <div key={idx} className="gl-item" onClick={()=>onSelect?.(r.it)} style={{ cursor:"pointer" }}>
              <div style={{ minWidth:72, opacity:0.65, fontSize:11 }}>{(r.it.ts_utc||"").slice(11,19)}</div>
              <div style={{ width:"100%" }}>
                <div className="gl-row" style={{ justifyContent:"space-between" }}>
                  <div className="gl-title">🐋 {r.origin} → {r.target}</div>
                  <span className={`gl-pill ${tone(String(r.it.severity||"").toLowerCase())}`}>{String(r.it.severity||"low").toUpperCase()}</span>
                </div>
                <div className="gl-sub">USD: {r.usd ? `$${r.usd.toLocaleString()}` : "n/a"}</div>
                <div className="gl-mini">{r.it.summary || ""}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="gl-list">
          {filtered.length===0 ? (
            <div style={{ padding:14, opacity:0.65, fontSize:12 }}>
              No events match filters yet.
            </div>
          ) : filtered.map((it, idx)=>(
            <div key={idx} className="gl-item" onClick={()=>onSelect?.(it)} style={{ cursor:"pointer" }}>
              <div style={{ minWidth:72, opacity:0.65, fontSize:11 }}>{(it.ts_utc||"").slice(11,19)}</div>
              <div style={{ width:"100%" }}>
                <div className="gl-row" style={{ justifyContent:"space-between" }}>
                  <div className="gl-title">{it.title || "(no title)"}</div>
                  <span className={`gl-pill ${tone(String(it.severity||"").toLowerCase())}`}>{String(it.severity||"low").toUpperCase()}</span>
                </div>
                {it.summary ? <div className="gl-sub">{it.summary}</div> : null}
                <div className="gl-mini">{it.source || ""}{it.location ? ` • ${it.location}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="gl-related">
        <div className="gl-row" style={{ justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontWeight:1200 }}>🧺 Related baskets</div>
          <div className="gl-mini">WOI found {related?.length || 0} markets</div>
        </div>
        {(baskets||[]).length===0 ? (
          <div className="gl-mini">Select an event to load related markets.</div>
        ) : baskets.slice(0,6).map((b, idx)=>(
          <div key={idx} style={{ marginBottom:10, border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:10 }}>
            <div className="gl-row" style={{ justifyContent:"space-between" }}>
              <div style={{ fontWeight:1100, fontSize:12 }}>{b.title}</div>
              <div className="gl-mini">{b.items.length} markets</div>
            </div>
            {(b.items||[]).slice(0,4).map((m, j)=>(
              <div key={j} className="gl-rel-row" style={{ padding:"8px 0" }}>
                <div style={{ maxWidth:260 }}>
                  <div className="gl-rel-title">{m.title || m.question || "Market"}</div>
                  <div className="gl-mini">{m.market_id || m.id || ""}</div>
                </div>
                <div className="gl-rel-actions">
                  <button className="gl-btn" onClick={(e)=>{ e.stopPropagation(); onWatch?.(m); }} style={{ padding:"7px 10px" }}>👁️</button>
                  <button className="gl-btn" onClick={(e)=>{ e.stopPropagation(); onTrade?.(m); }} style={{ padding:"7px 10px" }}>⚡</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
