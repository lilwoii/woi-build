
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

/**
 * 🐳 Whale / Flow scanner powered by OpenBB.
 * Tabs:
 *  - Dark Pool / OTC (symbol)
 *  - Short Interest (symbol)
 *  - Unusual Options (symbol)
 *  - Insider Trading (symbol)
 *  - Top Retail Flows (market)
 *
 * All endpoints are "best-effort" because OpenBB surfaces/providers vary by install.
 */

function pickNum(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v === null || v === undefined) continue;
    const n = typeof v === "string" ? Number(v.replace(/[,]/g, "")) : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function Spark({ points = [], height = 60 }) {
  const w = 260;
  const h = height;
  const pad = 8;
  const ys = points.map((p) => p.y).filter((v) => Number.isFinite(v));
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const span = Math.max(1e-9, maxY - minY);

  const d = points
    .map((p, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
      const y = h - pad - ((p.y - minY) * (h - pad * 2)) / span;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const last = points[points.length - 1]?.y;
  const first = points[0]?.y;
  const up = Number.isFinite(last) && Number.isFinite(first) ? last >= first : true;
  const stroke = up ? "rgba(70,255,140,0.9)" : "rgba(255,90,90,0.9)";
  const fill = up ? "rgba(70,255,140,0.12)" : "rgba(255,90,90,0.12)";

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} fill={fill} opacity="0.55" />
    </svg>
  );
}

const TAB_META = [
  { id: "darkpool", label: "Dark Pool / OTC", icon: "🏦", needsSymbol: true },
  { id: "short", label: "Short Interest", icon: "🩳", needsSymbol: true },
  { id: "unusual", label: "Unusual Options", icon: "🧨", needsSymbol: true },
  { id: "insider", label: "Insider Trading", icon: "🕵️", needsSymbol: true },
  { id: "retail", label: "Top Retail Flows", icon: "🛒", needsSymbol: false },
];

const PROVIDERS = {
  darkpool: ["finra"],
  short: ["finra", "fmp", "polygon"],
  unusual: ["intrinio", "tradier", "polygon"],
  insider: ["sec", "fmp"],
  retail: ["tradier", "fmp"],
};

export default function WhaleScanner() {
  const [symbol, setSymbol] = useState("TSLA");
  const [tab, setTab] = useState("darkpool");
  const [provider, setProvider] = useState((PROVIDERS.darkpool || ["finra"])[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Keep provider aligned with tab
  useEffect(() => {
    const list = PROVIDERS[tab] || ["finra"];
    if (!list.includes(provider)) setProvider(list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const endpoint = useMemo(() => {
    if (tab === "darkpool") return "/openbb/darkpool_otc";
    if (tab === "short") return "/openbb/short_interest";
    if (tab === "unusual") return "/openbb/options_unusual";
    if (tab === "insider") return "/openbb/insider_trading";
    if (tab === "retail") return "/openbb/top_retail_flows";
    return "/openbb/darkpool_otc";
  }, [tab]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams();
      if (TAB_META.find((t) => t.id === tab)?.needsSymbol) {
        qs.set("symbol", (symbol || "TSLA").trim().toUpperCase());
      }
      qs.set("provider", provider);

      // limits tuned per dataset
      if (tab === "retail") qs.set("limit", "60");
      else qs.set("limit", "120");

      const res = await fetch(`${API_BASE_URL}${endpoint}?${qs.toString()}`);
      const j = await res.json();
      if (!j?.ok) {
        setRows([]);
        setErr(
          j?.reason === "openbb_not_installed"
            ? "OpenBB not installed. Install OpenBB on this machine and restart backend."
            : j?.error || j?.reason || "OpenBB unavailable."
        );
      } else {
        setRows(Array.isArray(j.rows) ? j.rows : []);
      }
    } catch (e) {
      setRows([]);
      setErr("Failed to load OpenBB data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const points = useMemo(() => {
    const pts = [];
    for (const r of rows) {
      const y =
        pickNum(r, ["total", "total_volume", "volume", "shares", "shares_traded", "value", "notional", "amount"]) ??
        pickNum(r, ["darkpool_volume", "otc_volume", "short_interest", "short_volume", "premium", "size"]);
      if (Number.isFinite(y)) pts.push({ y });
    }
    return pts.slice(-80);
  }, [rows]);

  const columns = useMemo(() => {
    const set = new Set();
    rows.slice(0, 60).forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)));
    const preferred = [
      "_symbol",
      "date",
      "datetime",
      "time",
      "ticker",
      "symbol",
      "exchange",
      "side",
      "type",
      "sentiment",
      "direction",
      "strike",
      "expiration",
      "dte",
      "iv",
      "price",
      "size",
      "premium",
      "shares",
      "volume",
      "notional",
      "short_interest",
      "short_volume",
      "pct",
      "url",
      "source",
      "reporting_owner",
      "transaction_type",
    ];
    const ordered = [...preferred.filter((k) => set.has(k)), ...[...set].filter((k) => !preferred.includes(k))];
    return ordered.slice(0, 14);
  }, [rows]);

  const title = TAB_META.find((t) => t.id === tab)?.label || "Whale Scanner";

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>🐳 Whale / Flow</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>OpenBB powered</div>
        <div style={{ flex: 1 }} />

        {TAB_META.map((t) => (
          <button
            key={t.id}
            className={`pill ${tab === t.id ? "pillActive" : ""}`}
            onClick={() => setTab(t.id)}
            title={t.label}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ flex: 1 }} />

          {TAB_META.find((t) => t.id === tab)?.needsSymbol ? (
            <>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="input"
                style={{ width: 120 }}
                placeholder="TSLA"
              />
              <button className="pill" onClick={load} disabled={loading}>
                {loading ? "Loading…" : "Load"}
              </button>
            </>
          ) : null}

          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)} style={{ width: 160 }}>
            {(PROVIDERS[tab] || ["finra"]).map((p) => (
              <option key={p} value={p}>
                provider: {p}
              </option>
            ))}
          </select>

          <button className="pill" onClick={load} disabled={loading}>
            {loading ? "…" : "Refresh"}
          </button>
        </div>

        {err ? (
          <div style={{ marginTop: 10, color: "rgba(255,110,110,0.95)", fontSize: 12 }}>{err}</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 12 }}>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>📊 Activity</div>
              {points.length ? <Spark points={points} /> : <div style={{ opacity: 0.6, fontSize: 12 }}>No chartable values.</div>}
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>✅ Tips</div>
              <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.35 }}>
                <div>• Use the provider dropdown if a dataset returns empty.</div>
                <div>• Some OpenBB endpoints require API keys for specific providers.</div>
                <div>• If you get “surface missing”, update OpenBB or enable the relevant backend.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontWeight: 800 }}>Table</div>
          <div style={{ opacity: 0.65, fontSize: 12 }}>{rows.length} rows</div>
        </div>

        {rows.length === 0 ? (
          <div style={{ opacity: 0.7, fontSize: 12 }}>No data. Try another provider, or confirm OpenBB is installed.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} style={{ textAlign: "left", padding: "8px 10px", opacity: 0.85, fontSize: 12 }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {columns.map((c) => {
                      const v = r?.[c];
                      const isUrl = typeof v === "string" && /^https?:\/\//i.test(v);
                      return (
                        <td key={c} style={{ padding: "8px 10px", fontSize: 12, opacity: 0.92, whiteSpace: "nowrap" }}>
                          {isUrl ? (
                            <a href={v} target="_blank" rel="noreferrer" style={{ opacity: 0.9 }}>
                              link
                            </a>
                          ) : (
                            String(v ?? "")
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
