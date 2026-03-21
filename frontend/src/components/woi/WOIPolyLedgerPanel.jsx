import React, { useEffect, useMemo, useState } from "react";
import { woiApi } from "../../services/woiApi";
import "./woiPolish.css";

export default function WOIPolyLedgerPanel() {
  const [ledger, setLedger] = useState([]);
  const [meta, setMeta] = useState({ source: "—" });
  const [busy, setBusy] = useState(false);

  const [tokenFilter, setTokenFilter] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [grouped, setGrouped] = useState(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const res = await woiApi.polyLedger();
      setLedger(res.items || []);
      setMeta({ source: res.source || "—" });

      const gp = await woiApi.polyGroupedPnL();
      setGrouped(gp);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const tf = tokenFilter.trim().toLowerCase();
    const sf = strategyFilter.trim().toLowerCase();
    const srcf = sourceFilter.trim().toLowerCase();
    return ledger.filter(r => {
      if (tf && !(String(r.token_id||"").toLowerCase().includes(tf))) return false;
      if (sf && !(String(r.strategy||"").toLowerCase().includes(sf))) return false;
      if (srcf && !(String(r.source||"").toLowerCase().includes(srcf))) return false;
      return true;
    });
  }, [ledger, tokenFilter, strategyFilter, sourceFilter]);

  const overall = grouped?.overall || {};
  const emo = (v) => v > 0 ? "🟩" : v < 0 ? "🟥" : "🟨";

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ fontWeight: 1000, letterSpacing: 1 }}>📒 Polymarket Ledger</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:12, opacity:0.8 }}>Source: {meta.source}</span>
          <span style={{ fontSize:12, opacity:0.8 }}>
            {emo(Number(overall.realized_pnl||0))} Realized: {Number(overall.realized_pnl||0).toFixed(4)} •
            {emo(Number(overall.unrealized_pnl||0))} Unrealized: {Number(overall.unrealized_pnl||0).toFixed(4)} •
            🧾 Fees: {Number(overall.fees||0).toFixed(4)}
          </span>
          <a className="woi-btn" href={woiApi.polyLedgerCsvUrl()} target="_blank" rel="noreferrer"
            style={{ textDecoration:"none", padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000 }}>
            📤 Export CSV
          </a>
          <button className="woi-btn" disabled={busy} onClick={refresh}
            style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.06)", color:"rgba(240,255,250,0.92)", fontWeight:1000, cursor:"pointer" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, display:"flex", gap:10, flexWrap:"wrap" }}>
        <input value={tokenFilter} onChange={e=>setTokenFilter(e.target.value)} placeholder="Filter token…"
          style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.04)", color:"rgba(240,255,250,0.92)", outline:"none" }} />
        <input value={strategyFilter} onChange={e=>setStrategyFilter(e.target.value)} placeholder="Filter strategy…"
          style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.04)", color:"rgba(240,255,250,0.92)", outline:"none" }} />
        <input value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)} placeholder="Filter source… (clob/journal)"
          style={{ padding:"10px 12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", background:"rgba(255,255,255,0.04)", color:"rgba(240,255,250,0.92)", outline:"none" }} />
      </div>

      <div style={{ marginTop: 12, overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ textAlign:"left", opacity:0.8 }}>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Time</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Token</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Side</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Price</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Size</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Fee</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Strategy</th>
              <th style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(-600).reverse().map((r, idx) => (
              <tr key={idx}>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", opacity:0.8 }}>{String(r.ts_utc||"").slice(0,19)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontFamily:"ui-monospace" }}>{r.token_id}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontWeight:900 }}>{r.side === "buy" ? "🟩 BUY" : "🟥 SELL"}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{Number(r.price).toFixed(4)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{Number(r.size).toFixed(4)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{Number(r.fee||0).toFixed(4)}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontFamily:"ui-monospace" }}>{r.strategy}</td>
                <td style={{ padding:"10px 6px", borderBottom:"1px solid rgba(255,255,255,0.06)", opacity:0.8 }}>{r.source}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={8} style={{ padding: 12, opacity: 0.65 }}>No rows match filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        If you see many UNKNOWN strategies on CLOB trades, tune tolerances in `.env` (Bundle 10) and refresh.
      </div>
    </div>
  );
}
