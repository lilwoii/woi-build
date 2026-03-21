
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

/**
 * Lightweight RSS news bar (free sources, best effort).
 * Backend: GET /news/rss?limit=8&q=<query>
 * Optional OpenBB enrichment:
 *  - If `tickers` provided, backend GET /openbb/news_multi?symbols=...
 *  - Else if query looks like ticker, backend GET /openbb/news_company?symbol=...
 */
export default function RssNewsBar({ query = "", tickers = [], limit = 6, title = "AI News Summary" }) {
  const [items, setItems] = useState([]);
  const [ts, setTs] = useState(null);
  const [loading, setLoading] = useState(false);

  const tickersCsv = useMemo(() => {
    const arr = Array.isArray(tickers) ? tickers : [];
    const clean = arr.map((s) => (s || "").trim().toUpperCase()).filter(Boolean);
    // keep unique, cap
    return Array.from(new Set(clean)).slice(0, 12).join(",");
  }, [tickers]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/news/rss?limit=${encodeURIComponent(limit)}&q=${encodeURIComponent(query || "")}`
      );
      const data = await res.json();
      let merged = Array.isArray(data?.items) ? data.items : [];

      // OpenBB enrichment: multi-symbol if provided, else single ticker.
      try {
        if (tickersCsv) {
          const res2 = await fetch(
            `${API_BASE_URL}/openbb/news_multi?symbols=${encodeURIComponent(tickersCsv)}&limit_per_symbol=${encodeURIComponent(
              Math.max(2, Math.min(8, Math.floor(limit / 2) || 4))
            )}`
          );
          const data2 = await res2.json();
          if (data2?.ok && Array.isArray(data2?.rows)) {
            const mapped = data2.rows
              .map((x) => ({
                title: x.title || x.headline || x.text || "OpenBB News",
                link: x.url || x.link || x.source_url || "",
                source: x.source || x.provider || "OpenBB",
                pubDate: x.date || x.published || x.datetime || x.created_at || null,
                _symbol: x._symbol || "",
              }))
              .filter((x) => x.link || x.title);
            merged = [...mapped, ...merged];
          }
        } else {
          const q = (query || "").trim().toUpperCase();
          const looksLikeTicker = /^[A-Z.\-]{1,8}$/.test(q);
          if (looksLikeTicker) {
            const res2 = await fetch(
              `${API_BASE_URL}/openbb/news_company?symbol=${encodeURIComponent(q)}&limit=${encodeURIComponent(
                Math.min(10, Math.max(4, limit))
              )}`
            );
            const data2 = await res2.json();
            if (data2?.ok && Array.isArray(data2?.rows)) {
              const mapped = data2.rows
                .map((x) => ({
                  title: x.title || x.headline || x.text || "OpenBB News",
                  link: x.url || x.link || x.source_url || "",
                  source: x.source || x.provider || "OpenBB",
                  pubDate: x.date || x.published || x.datetime || x.created_at || null,
                  _symbol: q,
                }))
                .filter((x) => x.link || x.title);
              merged = [...mapped, ...merged];
            }
          }
        }
      } catch (e) {
        // ignore enrichment errors
      }

      // Dedup by link/title
      const seen = new Set();
      const deduped = [];
      for (const it of merged) {
        const key = (it.link || "") + "|" + (it.title || "");
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(it);
      }

      setItems(deduped.slice(0, limit));
      setTs(new Date().toISOString());
    } catch (e) {
      setItems([]);
      setTs(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tickersCsv, limit]);

  return (
    <div className="rssCard">
    <div className="card" style={{ padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>{title}</div>
        <div style={{ flex: 1 }} />
        <div style={{ opacity: 0.6, fontSize: 11 }}>{ts ? `updated ${new Date(ts).toLocaleTimeString()}` : ""}</div>
        <button className="pill" onClick={load} disabled={loading} style={{ padding: "6px 10px" }}>
          {loading ? "…" : "↻"}
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          No RSS headlines yet (some feeds rate-limit). OpenBB enrichment will appear when available.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((it, idx) => (
            <a
              key={idx}
              href={it.link || "#"}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
              className="newsRow"
            >
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <div style={{ fontWeight: 700, flex: 1, lineHeight: 1.2 }}>
                  {it._symbol ? <span style={{ opacity: 0.7, marginRight: 8 }}>[{it._symbol}]</span> : null}
                  {it.title}
                </div>
                <div style={{ opacity: 0.6, fontSize: 11, whiteSpace: "nowrap" }}>{it.source || ""}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
