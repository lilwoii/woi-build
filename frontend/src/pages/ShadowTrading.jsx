import React, { useEffect, useState } from "react";

export default function ShadowTrading() {
  const [book, setBook] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/mega/shadow/book");
      const data = await res.json();
      setBook(data.book?.items || []);
      setSummary(data.summary || null);
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: 18, color: "#fff" }}>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>👻 Shadow Trading</div>
      <div style={{ opacity: 0.8, marginBottom: 18 }}>
        Mirror decisions without live execution • score drift • compare expected vs current
      </div>

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            ["📂 Count", summary.count],
            ["🟢 Open", summary.open],
            ["✅ Closed", summary.closed],
            ["📈 Avg PnL %", summary.avg_pnl_pct],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#111827", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{label}</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {book.map((item) => (
          <div key={item.trade_id} style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{item.symbol} • {item.side}</div>
              <div>{item.status}</div>
            </div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>{item.thesis}</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
              Strategy: {item.strategy_id} • Entry: {item.entry_ref} • Current: {item.current_ref} • PnL: {item.pnl_pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}