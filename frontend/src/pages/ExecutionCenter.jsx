import React, { useEffect, useState } from "react";

export default function ExecutionCenter() {
  const [controls, setControls] = useState(null);
  const [preview, setPreview] = useState(null);
  const [queued, setQueued] = useState([]);
  const [order, setOrder] = useState({
    symbol: "SPY",
    asset_class: "stocks",
    side: "BUY",
    qty: 1,
    price: 500,
    notional_usd: 500,
    mode: "paper",
    open_positions: 1,
  });

  const load = async () => {
    const [controlsRes, queuedRes] = await Promise.all([
      fetch("/api/woi/execution/controls"),
      fetch("/api/woi/execution/live/queued"),
    ]);
    const c = await controlsRes.json();
    const q = await queuedRes.json();
    setControls(c.controls || null);
    setQueued(q.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const saveControls = async (next) => {
    setControls(next);
    await fetch("/api/woi/execution/controls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  const runPreview = async () => {
    const res = await fetch("/api/woi/execution/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    setPreview(data);
  };

  const submitOrder = async () => {
    await fetch("/api/woi/execution/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    load();
  };

  const approveLive = async (queueId) => {
    await fetch("/api/woi/execution/live/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queue_id: queueId }),
    });
    load();
  };

  if (!controls) return <div style={{ padding: 18, color: "#fff" }}>Loading execution center…</div>;

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>💸 Execution Center</div>
        <div style={{ opacity: 0.8 }}>
          Paper / live / shadow controls • guarded approval • Discord-first execution alerts
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {[
          ["paper_enabled", "📄 Paper"],
          ["live_enabled", "🟢 Live"],
          ["shadow_enabled", "👻 Shadow"],
          ["require_guard_approval", "🛡️ Guard Approval"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => saveControls({ ...controls, [key]: !controls[key] })}
            style={{
              borderRadius: 14,
              padding: 16,
              background: controls[key] ? "rgba(34,197,94,0.18)" : "#111827",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.10)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 800 }}>{label}</div>
            <div style={{ marginTop: 8 }}>{String(controls[key])}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Order Builder</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {Object.entries(order).map(([k, v]) => (
            <input
              key={k}
              value={v}
              onChange={(e) => setOrder(prev => ({ ...prev, [k]: e.target.value }))}
              placeholder={k}
              style={{ padding: 12, borderRadius: 12, background: "#111827", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={runPreview} style={{ padding: "10px 16px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Preview</button>
          <button onClick={submitOrder} style={{ padding: "10px 16px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Submit</button>
        </div>
      </div>

      {preview && (
        <div style={{ background: "#111827", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Preview</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}

      <div style={{ background: "#0b1220", borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Queued Live Orders</div>
        <div style={{ display: "grid", gap: 10 }}>
          {queued.map((item) => (
            <div key={item.queue_id} style={{ background: "#111827", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{item.symbol} • {item.side}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>{item.asset_class} • ${item.notional_usd}</div>
              <button onClick={() => approveLive(item.queue_id)} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
                Approve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}