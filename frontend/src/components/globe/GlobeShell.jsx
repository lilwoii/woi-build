import React, { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as topojson from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";
import usTopo from "us-atlas/states-10m.json";
import { API_BASE_URL } from "../../config";
import GlobeTicker from "./GlobeTicker";
import GlobePanel from "./GlobePanel";
import GlobeLegend from "./GlobeLegend";
import "./GlobeStyles.css";
import {
  buildRegionMap, findVolumeForRegion, volumeToIntensity, shadeRGBA,
  centroidFor, volumeTier, polygonCentroid, extractRegionFromLocation,
  stateNameFromId, inferRegionFromText
} from "./HeatmapUtil";

const sevNorm = (s)=>String(s||"low").toLowerCase();
const colorFor = (sev)=>{
  if (sev==="critical") return "rgba(255,90,90,0.95)";
  if (sev==="high") return "rgba(120,255,210,0.95)";
  return "rgba(255,255,255,0.85)";
};

function getWorldPolygons() {
  try { return topojson.feature(worldTopo, worldTopo.objects.countries).features || []; }
  catch { return []; }
}
function getUsStatePolygons() {
  try { return topojson.feature(usTopo, usTopo.objects.states).features || []; }
  catch { return []; }
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function logScale(x){
  const v = Number(x||0);
  if (!isFinite(v) || v<=0) return 0;
  return Math.log10(1+v);
}

export default function GlobeShell() {
  const globeRef = useRef();
  const [tab, setTab] = useState("feed");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tension, setTension] = useState({ score: 0, label: "low", counts: {low:0,high:0,critical:0} });
  const [volume, setVolume] = useState({ by_region: {} });
  const [related, setRelated] = useState([]);
  const [showTrade, setShowTrade] = useState(false);
  const [tradeDraft, setTradeDraft] = useState({ token_id:"", side:"buy", price:0.55, size:25 });
  const [hoverTension, setHoverTension] = useState(false);
  const [regionFilter, setRegionFilter] = useState("");
  const [hoverState, setHoverState] = useState(null);

  const fetchEvents = async ()=>{
    try{
      const r = await fetch(`${API_BASE_URL}/api/woi/globe/events?limit=1600&type=${tab}`);
      const j = await r.json();
      setItems(j?.items || []);
      setTension(j?.tension_24h || {score:0,label:"low",counts:{low:0,high:0,critical:0}});
      setVolume(j?.volume || {by_region:{}});
    }catch{}
  };
  useEffect(()=>{ fetchEvents(); const t=setInterval(fetchEvents, 2500); return ()=>clearInterval(t); }, [tab]);

  useEffect(()=>{
    try{
      const g = globeRef.current;
      if (!g) return;
      g.pointOfView({ lat: 20, lng: 10, altitude: 2.05 }, 900);
    }catch{}
  }, []);

  const regionMap = useMemo(()=> buildRegionMap(volume?.by_region || {}), [volume]);

  const worldPolys = useMemo(()=> getWorldPolygons().map(f=>{
    const name = f?.properties?.name;
    const vol = findVolumeForRegion(regionMap, name);
    return { ...f, __name: name, __vol: vol, __fill: shadeRGBA(volumeToIntensity(vol)) };
  }), [regionMap]);

  // US polygons with centroid + signal counts, and hover/click support
  const usPolys = useMemo(()=> {
    const feats = getUsStatePolygons().map(f=>{
      const name = f?.properties?.name || f?.properties?.NAME || stateNameFromId(f?.id) || f?.id;
      const vol = findVolumeForRegion(regionMap, name);
      const intensity = volumeToIntensity(vol);
      const ctr = polygonCentroid(f);
      return { ...f, __name: name, __vol: vol, __int: intensity, __fill: shadeRGBA(Math.min(1, intensity*1.15)), __ctr: ctr };
    });

    // attach signal counts per state (best-effort string match)
    const counts = {};
    for (const it of (items||[])){
      const loc = `${it.location||""} ${it.meta?.state||""} ${it.meta?.region||""}`.toLowerCase();
      for (const st of feats){
        const key = String(st.__name||"").toLowerCase();
        if (key && loc.includes(key)){
          counts[key] = (counts[key]||0)+1;
        }
      }
    }
    return feats.map(f=>{
      const c = counts[String(f.__name||"").toLowerCase()] || 0;
      return { ...f, __signals: c };
    });
  }, [regionMap, items]);

  // Top regions list for legend
  const topRegions = useMemo(()=>{
    return Object.entries(volume?.by_region || {})
      .map(([k,v])=>({ name:k, v:Number(v||0) }))
      .filter(x=>x.v>0)
      .sort((a,b)=>b.v-a.v)
      .slice(0, 30)
      .map(x=>({ ...x, tier: volumeTier(x.v) }));
  }, [volume]);

  // Pin fallback: location -> centroid, else infer from title/summary keywords
  const points = useMemo(()=>{
    const out = [];
    for (const it of (items||[])){
      let lat = it.lat, lng = it.lng;
      if (typeof lat !== "number" || typeof lng !== "number"){
        const locGuess = extractRegionFromLocation(it.location || it.meta?.region || it.meta?.country || it.meta?.state || "");
        const textGuess = inferRegionFromText(`${it.title||""} ${it.summary||""} ${it.source||""}`);
        const key = locGuess || textGuess || it.meta?.region || it.meta?.country || it.meta?.state;
        const c = centroidFor(key);
        if (c) { lat = c.lat; lng = c.lng; }
      }
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      out.push({
        lat, lng,
        size: sevNorm(it.severity)==="critical" ? 0.55 : sevNorm(it.severity)==="high" ? 0.34 : 0.25,
        color: colorFor(sevNorm(it.severity)),
        meta: it
      });
    }
    return out;
  }, [items]);

  const flightLabels = useMemo(()=>{
    if (tab !== "flight") return [];
    return (items||[])
      .map(it => {
        const tgt = it?.meta?.target;
        if (tgt && typeof tgt.lat==="number" && typeof tgt.lng==="number"){
          return { lat: tgt.lat, lng: tgt.lng, text: "✈", size: 1.2, kind:"flight", region:"" , meta: it };
        }
        if (typeof it.lat==="number" && typeof it.lng==="number"){
          return { lat: it.lat, lng: it.lng, text: "✈", size: 1.0, kind:"flight", region:"", meta: it };
        }
        return null;
      }).filter(Boolean);
  }, [items, tab]);

  // Capital flow arcs scaling: width/anim time depends on notional/altitude
  const arcs = useMemo(()=>{
    if (tab !== "flight" && tab !== "whale") return [];
    const out = [];
    for (const it of (items||[])){
      const o = it?.meta?.origin;
      const t = it?.meta?.target;
      if (o && t && typeof o.lat==="number" && typeof o.lng==="number" && typeof t.lat==="number" && typeof t.lng==="number"){
        const sev = sevNorm(it.severity);
        const base = sev==="critical" ? 1.25 : sev==="high" ? 0.95 : 0.75;

        // whales: scale by usd/notional
        const usd = Number(it?.meta?.usd || it?.meta?.notional || it?.meta?.volume || 0);
        const ls = logScale(usd);
        const w = clamp(0.4 + ls*0.35, 0.5, 3.4);
        const anim = clamp(2400 - ls*260, 850, 2400);

        // flights: scale by altitude (if available)
        const alt = Number(it?.meta?.altitude_ft || it?.meta?.altitude || 0);
        const lalt = logScale(alt);
        const wf = clamp(0.6 + lalt*0.22, 0.6, 2.2);
        const animf = clamp(2400 - lalt*220, 900, 2400);

        out.push({
          startLat: o.lat, startLng: o.lng,
          endLat: t.lat, endLng: t.lng,
          color: [colorFor(sev), "rgba(255,255,255,0.12)"],
          width: tab==="whale" ? w*base : wf*base,
          anim: tab==="whale" ? anim : animf,
          meta: it
        });
      }
    }
    return out;
  }, [items, tab]);

  const clear = async ()=>{
    try{ await fetch(`${API_BASE_URL}/api/woi/globe/events`, { method:"DELETE" }); setItems([]); }catch{}
  };

  const loadRelated = async (ev)=>{
    const tags = (ev?.meta?.tags || []).join(" ");
    const q = encodeURIComponent((ev?.title || "") + " " + (ev?.meta?.topic||"") + " " + (ev?.meta?.category||"") + " " + tags);
    try{
      const r = await fetch(`${API_BASE_URL}/api/woi/globe/related_markets?q=${q}&limit=20`);
      const j = await r.json();
      setRelated(j?.items || []);
    }catch{ setRelated([]); }
  };

  const onSelect = (ev)=>{ setSelected(ev); loadRelated(ev); };

  const watchMarket = async (m)=>{
    try{ await fetch(`${API_BASE_URL}/api/woi/globe/watch`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(m) }); }catch{}
  };

  const tradeMarket = (m)=>{
    const tok = m.yes || m.token_id || m.tokenId || m.outcome || "";
    setTradeDraft({ token_id: tok, side:"buy", price:0.55, size:25 });
    setShowTrade(true);
  };

  const submitTrade = async ()=>{
    try{
      const order = { token_id: tradeDraft.token_id, side: tradeDraft.side, type:"limit", price: Number(tradeDraft.price), size: Number(tradeDraft.size), tag:"globe_quick_trade" };
      await fetch(`${API_BASE_URL}/api/woi/polymarket/execute_guarded`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ order, expected_mid: Number(tradeDraft.price) })
      });
    }catch{}
    setShowTrade(false);
  };

  const tbad = (tension?.label==="high"||tension?.label==="severe");
  const tgood = (tension?.label==="elevated");

  const topicChips = useMemo(()=>{
    const set = new Set();
    if (selected?.meta?.topic) set.add(selected.meta.topic);
    if (selected?.meta?.tags) (selected.meta.tags||[]).forEach(t=>set.add(t));
    return Array.from(set).filter(Boolean);
  }, [selected]);

  const categoryChips = useMemo(()=>{
    const set = new Set();
    if (selected?.meta?.category) set.add(selected.meta.category);
    return Array.from(set).filter(Boolean);
  }, [selected]);

  // Clickable volume labels (countries/states)
  const volumeChipLabels = useMemo(()=>{
    const labels = [];
    // countries by provided centroids
    for (const e of topRegions.slice(0,18)){
      const c = centroidFor(e.name);
      if (!c) continue;
      labels.push({
        lat: c.lat, lng: c.lng,
        text: `${e.tier} VOL • ${e.name}`,
        size: e.tier==="HIGH" ? 1.05 : e.tier==="MID" ? 0.92 : 0.82,
        kind: "volume",
        region: e.name
      });
    }
    // top US states by polygon centroid
    const topStates = usPolys
      .filter(p => (p.__vol||0) > 0 && p.__ctr)
      .sort((a,b)=>(b.__vol||0)-(a.__vol||0))
      .slice(0, 10);
    for (const st of topStates){
      labels.push({
        lat: st.__ctr.lat, lng: st.__ctr.lng,
        text: `${volumeTier(st.__vol)} VOL • ${st.__name}`,
        size: volumeTier(st.__vol)==="HIGH" ? 1.0 : 0.88,
        kind: "volume",
        region: st.__name
      });
    }
    return labels;
  }, [topRegions, usPolys]);

  const onLabelClick = (lbl)=>{
    if (lbl?.kind === "volume" && lbl?.region){
      setTab("feed");
      setRegionFilter(lbl.region);
      const pseudo = { title: `Region: ${lbl.region}`, meta:{ region: lbl.region, tags:[lbl.region] } };
      setSelected(null);
      loadRelated(pseudo);
    }
  };

  const onStateClick = (poly)=>{
    const name = poly?.__name;
    if (!name) return;
    setTab("feed");
    setRegionFilter(name);
    setSelected(null);
    const pseudo = { title: `State: ${name}`, meta:{ region: name, tags:[name] } };
    loadRelated(pseudo);
  };

  const onStateHover = (poly)=>{
    if (!poly) { setHoverState(null); return; }
    const name = poly.__name || "State";
    setHoverState({
      name,
      vol: poly.__vol || 0,
      signals: poly.__signals || 0,
      tier: volumeTier(poly.__vol || 0)
    });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div className="gl-card">
        <div className="gl-topbar">
          <div>
            <div style={{ fontSize:18, fontWeight:1200 }}>🌍 Globe Intel</div>
            <div style={{ fontSize:12, opacity:0.75, marginTop:6 }}>
              Hover US states for tooltips. Click a state or volume label to filter. Whale/flight arcs scale by intensity.
            </div>
          </div>
          <div className="gl-row">
            <span className="gl-pill good">LIVE</span>
            <span className="gl-pill">signals: {items.length}</span>

            <span
              className={`gl-pill ${tbad?"bad":(tgood?"good":"")}`}
              onMouseEnter={()=>setHoverTension(true)}
              onMouseLeave={()=>setHoverTension(false)}
              style={{ cursor:"default" }}
            >
              GLOBAL TENSION {tension?.score ?? 0} • {String(tension?.label||"low").toUpperCase()}
            </span>

            <button className="gl-btn" onClick={fetchEvents}>↻ Refresh</button>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <GlobeTicker items={(items||[]).slice(-10).map(e=>({ severity:e.severity, title:e.title, delta:e.meta?.delta }))} />
        </div>
      </div>

      <div className="gl-shell">
        <div className="gl-card" style={{ padding:0, overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", top:12, left:12, zIndex:5 }} className="gl-row">
            <span className="gl-pill">GLOBAL TENSION</span>
            <span className={`gl-pill ${tbad?"bad":(tgood?"good":"")}`}>
              {String(tension?.label||"low").toUpperCase()}
            </span>
            <span className="gl-pill good">{tab.toUpperCase()}</span>
          </div>

          {hoverTension && (
            <div className="gl-tension-card">
              <div style={{ fontWeight:1200 }}>Global Tension Index</div>
              <div className="gl-mini" style={{ marginTop:6 }}>
                Weighted sum of signals from the last 24 hours.
              </div>
              <div className="gl-tension-bar">
                <div className="gl-tension-fill" style={{ width: `${Math.min(100, Number(tension?.score||0))}%` }} />
              </div>
              <div style={{ display:"flex", gap:10, marginTop:10, fontSize:12, opacity:0.8 }}>
                <div>🔴 Critical: {tension?.counts?.critical ?? 0}</div>
                <div>🟢 High: {tension?.counts?.high ?? 0}</div>
                <div>⚪ Low: {tension?.counts?.low ?? 0}</div>
              </div>
            </div>
          )}

          {hoverState && (
            <div className="gl-state-tip">
              <div className="title">🏛 {hoverState.name}</div>
              <div className="sub">Volume: {hoverState.tier} • {Number(hoverState.vol||0).toLocaleString()}</div>
              <div className="sub">Signals: {hoverState.signals}</div>
              <div className="sub">Click state to filter feed</div>
            </div>
          )}

          <div style={{ height:790 }}>
            {/* Base world heatmap globe */}
            <Globe
              ref={globeRef}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

              polygonsData={worldPolys}
              polygonAltitude={d => 0.02 + volumeToIntensity(d.__vol||0) * 0.12}
              polygonCapColor={d => d.__fill || "rgba(120,255,210,0.08)"}
              polygonSideColor={() => "rgba(0,0,0,0)"}
              polygonStrokeColor={() => "rgba(255,255,255,0.05)"}
              polygonsTransitionDuration={380}

              pointsData={[]}
              labelsData={[]}
              arcsData={[]}
            />

            {/* Interactive overlay: US polygons + pins + arcs + labels */}
            <div style={{ position:"absolute", inset:0 }}>
              <Globe
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl={null}
                bumpImageUrl={null}
                showGlobe={false}
                showAtmosphere={false}

                // US polygons interactive
                polygonsData={usPolys}
                polygonAltitude={d => 0.03 + volumeToIntensity(d.__vol||0) * 0.16}
                polygonCapColor={d => d.__fill || "rgba(120,255,210,0.08)"}
                polygonSideColor={() => "rgba(0,0,0,0)"}
                polygonStrokeColor={() => "rgba(255,255,255,0.10)"}
                polygonsTransitionDuration={380}
                onPolygonHover={onStateHover}
                onPolygonClick={onStateClick}

                pointsData={points}
                pointAltitude={d => d.size}
                pointColor={d => d.color}
                pointRadius={0.18}
                onPointClick={(p)=>onSelect(p?.meta || null)}

                arcsData={arcs}
                arcColor={"color"}
                arcStroke={d => d.width || 0.7}
                arcDashLength={0.55}
                arcDashGap={2.2}
                arcDashAnimateTime={d => d.anim || 2400}

                labelsData={[...flightLabels, ...volumeChipLabels]}
                labelText={d=>d.text}
                labelSize={d=>d.size}
                labelDotRadius={0.2}
                labelColor={() => "rgba(255,255,255,0.92)"}
                labelAltitude={0.02}
                onLabelClick={onLabelClick}

                onGlobeClick={()=>{ setSelected(null); }}
              />
            </div>
          </div>

          {/* Legend */}
          <GlobeLegend
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            tension={tension}
            counts={tension?.counts}
            topRegions={topRegions}
          />

          {selected && (
            <div style={{
              position:"absolute", right:18, top:84, width:400, zIndex:6,
              border:"1px solid rgba(255,255,255,0.10)",
              background:"rgba(10,14,18,.92)",
              borderRadius:18, padding:14, boxShadow:"0 18px 44px rgba(0,0,0,.55)"
            }}>
              <div className="gl-row" style={{ justifyContent:"space-between" }}>
                <div style={{ fontWeight:1200 }}>{selected.title || "Event"}</div>
                <button className="gl-btn" onClick={()=>setSelected(null)} style={{ padding:"6px 10px" }}>✕</button>
              </div>
              {selected.summary ? <div style={{ marginTop:8, fontSize:12, opacity:0.8 }}>{selected.summary}</div> : null}
              <div style={{ marginTop:10, fontSize:12, opacity:0.65 }}>
                {selected.source || ""}{selected.location ? ` • ${selected.location}` : ""}
              </div>
              {selected.url ? (
                <div style={{ marginTop:8, fontSize:12 }}>
                  <a href={selected.url} target="_blank" rel="noreferrer" style={{ color:"rgba(120,255,210,0.95)" }}>{selected.url}</a>
                </div>
              ) : null}
              <div style={{ marginTop:10 }} className="gl-row">
                <span className={`gl-pill ${sevNorm(selected.severity)==="critical"?"bad":(sevNorm(selected.severity)==="high"?"good":"")}`}>
                  {String(selected.severity||"low").toUpperCase()}
                </span>
                <span className="gl-pill">{(selected.ts_utc||"").slice(11,19)}</span>
              </div>
            </div>
          )}

          {showTrade && (
            <div style={{
              position:"absolute", left:18, bottom:18, width:440, zIndex:7,
              border:"1px solid rgba(255,255,255,0.10)", background:"rgba(10,14,18,.92)",
              borderRadius:18, padding:14, boxShadow:"0 18px 44px rgba(0,0,0,.55)"
            }}>
              <div className="gl-row" style={{ justifyContent:"space-between" }}>
                <div style={{ fontWeight:1200 }}>⚡ Quick Trade (Guarded)</div>
                <button className="gl-btn" onClick={()=>setShowTrade(false)} style={{ padding:"6px 10px" }}>✕</button>
              </div>
              <div className="gl-mini" style={{ marginTop:6 }}>Routes through guarded execution → risk governor → shadow/live toggles.</div>

              <div className="gl-row" style={{ marginTop:10 }}>
                <input className="gl-input" value={tradeDraft.token_id} onChange={(e)=>setTradeDraft(s=>({...s, token_id:e.target.value}))} placeholder="token_id / outcome id" />
              </div>
              <div className="gl-row" style={{ marginTop:10 }}>
                <button className={`gl-tab ${tradeDraft.side==="buy"?"active":""}`} onClick={()=>setTradeDraft(s=>({...s, side:"buy"}))}>BUY</button>
                <button className={`gl-tab ${tradeDraft.side==="sell"?"active":""}`} onClick={()=>setTradeDraft(s=>({...s, side:"sell"}))}>SELL</button>
                <input className="gl-input" style={{ maxWidth:120 }} value={tradeDraft.price} onChange={(e)=>setTradeDraft(s=>({...s, price:e.target.value}))} placeholder="price" />
                <input className="gl-input" style={{ maxWidth:120 }} value={tradeDraft.size} onChange={(e)=>setTradeDraft(s=>({...s, size:e.target.value}))} placeholder="size" />
                <button className="gl-btn" onClick={submitTrade}>🚀 Send</button>
              </div>
            </div>
          )}
        </div>

        <GlobePanel
          tab={tab}
          setTab={setTab}
          items={items}
          tension={tension}
          onSelect={onSelect}
          onClear={clear}
          onRefresh={fetchEvents}
          related={related}
          onWatch={watchMarket}
          onTrade={tradeMarket}
          topicChips={topicChips}
          categoryChips={categoryChips}
          regionFilter={regionFilter}
        />
      </div>
    </div>
  );
}
