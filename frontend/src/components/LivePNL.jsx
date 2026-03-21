import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

// Minimal, dependency-free PnL line chart (SVG)
const PnlLine = ({ points, height = 180 }) => {
  const { minY, maxY } = useMemo(() => {
    if (!points?.length) return { minY: 0, maxY: 1 };
    let min = points[0].equity;
    let max = points[0].equity;
    for (const p of points) {
      const y = Number(p.equity);
      if (Number.isFinite(y)) {
        if (y < min) min = y;
        if (y > max) max = y;
      }
    }
    if (min === max) return { minY: min - 1, maxY: max + 1 };
    return { minY: min, maxY: max };
  }, [points]);

  const w = 520;
  const h = height;

  const poly = useMemo(() => {
    if (!points?.length) return "";
    const n = points.length;
    const dx = n <= 1 ? 0 : w / (n - 1);
    const span = maxY - minY || 1;

    return points
      .map((p, i) => {
        const x = i * dx;
        const y = h - ((Number(p.equity) - minY) / span) * h;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points, minY, maxY]);

  const last = points?.[points.length - 1];

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 700 }}>📈 Live PnL</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {last?.ts ? new Date(last.ts).toLocaleTimeString() : ""}
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 16,
          background: "rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pnlFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,255,180,0.35)" />
              <stop offset="100%" stopColor="rgba(0,255,180,0.02)" />
            </linearGradient>
          </defs>
          {/* baseline */}
          <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="rgba(255,255,255,0.08)" />
          {poly && (
            <>
              <polyline
                points={poly}
                fill="none"
                stroke="rgba(0,255,180,0.95)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline points={`${poly} ${w},${h} 0,${h}`} fill="url(#pnlFade)" stroke="none" />
            </>
          )}
        </svg>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 10, fontSize: 12, opacity: 0.9 }}>
        <span>Equity:</span>
        <span style={{ fontWeight: 700 }}>${last?.equity?.toLocaleString?.() ?? "—"}</span>
        <span style={{ opacity: 0.7 }}>|</span>
        <span style={{ opacity: 0.8 }}>Range:</span>
        <span>
          ${minY.toLocaleString?.() ?? "—"} → ${maxY.toLocaleString?.() ?? "—"}
        </span>
      </div>
    </div>
  );
};

export default function LivePNL({ compact = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [series, setSeries] = useState([]);
  const [trades, setTrades] = useState([]);
  const [meta, setMeta] = useState({ mode: "demo", account: null });

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pnl/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setSeries(Array.isArray(data.series) ? data.series : []);
        setTrades(Array.isArray(data.trades) ? data.trades : []);
        setMeta({ mode: data.mode || "demo", account: data.account || null });
        setError(null);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(String(e?.message || e));
        setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div
      style={{
        padding: compact ? 12 : 18,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: compact ? 16 : 18, fontWeight: 800 }}>
          💹 Live PnL & Trades
          <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.75 }}>
            {meta.mode === "live" ? "LIVE" : meta.mode === "paper" ? "PAPER" : "DEMO"}
          </span>
        </div>
        {meta.account && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Buying power: ${Number(meta.account.buying_power || 0).toLocaleString()}
          </div>
        )}
      </div>

      {loading && <div style={{ marginTop: 12, opacity: 0.8 }}>Loading…</div>}
      {error && (
        <div style={{ marginTop: 12, color: "#ff6b6b", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <PnlLine points={series} height={compact ? 160 : 200} />
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>🧾 Recent Trades</div>
        <div style={{ overflow: "auto", maxHeight: compact ? 260 : 380 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.85 }}>
                <th style={{ padding: "8px 6px" }}>Time</th>
                <th style={{ padding: "8px 6px" }}>Symbol</th>
                <th style={{ padding: "8px 6px" }}>Side</th>
                <th style={{ padding: "8px 6px" }}>Qty</th>
                <th style={{ padding: "8px 6px" }}>Price</th>
                <th style={{ padding: "8px 6px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(trades || []).slice(0, 200).map((t, idx) => (
                <tr
                  key={`${t.id || idx}-${idx}`}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)", opacity: 0.95 }}
                >
                  <td style={{ padding: "8px 6px", whiteSpace: "nowrap", opacity: 0.85 }}>
                    {t.ts ? new Date(t.ts).toLocaleTimeString() : "—"}
                  </td>
                  <td style={{ padding: "8px 6px", fontWeight: 700 }}>{t.symbol || "—"}</td>
                  <td style={{ padding: "8px 6px", fontWeight: 800 }}>
                    {String(t.side || "").toUpperCase() === "BUY" ? "🟢 BUY" : "🔴 SELL"}
                  </td>
                  <td style={{ padding: "8px 6px" }}>{t.qty ?? "—"}</td>
                  <td style={{ padding: "8px 6px" }}>{t.price != null ? `$${Number(t.price).toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "8px 6px", opacity: 0.85 }}>{t.status || "—"}</td>
                </tr>
              ))}
              {!trades?.length && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 10, opacity: 0.7 }}>
                    No trades yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
