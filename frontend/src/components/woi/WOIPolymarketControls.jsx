import React, { useState } from "react";
import { woiApi } from "../../services/woiApi";
import WalletConnectButton from "./WalletConnectButton";
import "./woiPolish.css";

export default function WOIPolymarketControls({ status, onRefresh }) {
  const [manualRule, setManualRule] = useState("");
  const [busy, setBusy] = useState(false);

  const [tokenId, setTokenId] = useState("");
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("0.50");
  const [size, setSize] = useState("1");

  const poly = status?.polymarket || {};
  const modeLabel = !poly.enabled ? "🟥 OFF" : (poly.dry_run ? "🟨 DRY_RUN" : "🟩 LIVE");

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally {
      setBusy(false);
      onRefresh?.();
    }
  };

  const placeTestOrder = async () => {
    return run(() => woiApi.polyOrder({
      token_id: tokenId.trim(),
      side,
      price: Number(price),
      size: Number(size)
    }));
  };

  return (
    <div className="woi-card woi-fade-in" style={{
      padding: 16,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>🟪 Polymarket</div>
        <div style={{ fontSize: 12, opacity: 0.86 }}>
          Mode: <span style={{ fontWeight: 900 }}>{modeLabel}</span> • 5m: {poly.running_5m ? "🟩 RUNNING" : "🟥 STOPPED"}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <WalletConnectButton onConnected={() => {}} />
        <a
          href="https://polymarket.com"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, opacity: 0.85, color: "rgba(0,255,200,0.9)", textDecoration: "none" }}
        >
          💳 Deposit funds (MoonPay / USDC on Polygon) → open Polymarket
        </a>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button disabled={busy} onClick={() => run(() => woiApi.polySetMode("off"))} className="woi-btn" style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,120,120,0.28)", background: "rgba(255,120,120,0.08)",
          color: "rgba(255,230,230,0.95)", cursor: "pointer", fontWeight: 900
        }}>🟥 OFF</button>

        <button disabled={busy} onClick={() => run(() => woiApi.polySetMode("dry_run"))} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(241,196,15,0.28)", background: "rgba(241,196,15,0.10)",
          color: "rgba(255,245,210,0.95)", cursor: "pointer", fontWeight: 900
        }}>🟨 DRY_RUN</button>

        <button disabled={busy} onClick={() => run(() => woiApi.polySetMode("live"))} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,255,200,0.22)", background: "rgba(0,255,200,0.10)",
          color: "rgba(220,255,248,0.95)", cursor: "pointer", fontWeight: 900
        }}>🟩 LIVE</button>

        <button disabled={busy} onClick={() => run(() => woiApi.polyStart5m())} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,255,200,0.22)", background: "rgba(0,255,200,0.10)",
          color: "rgba(220,255,248,0.95)", cursor: "pointer"
        }}>⚡ Start 5-Min Strategy</button>

        <button disabled={busy} onClick={() => run(() => woiApi.polyStop5m())} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,120,120,0.28)", background: "rgba(255,120,120,0.08)",
          color: "rgba(255,230,230,0.95)", cursor: "pointer"
        }}>🛑 Stop</button>

        <button disabled={busy} onClick={() => run(() => woiApi.polyConnect())} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)",
          color: "rgba(240,255,250,0.92)", cursor: "pointer"
        }}>🔑 Derive API creds</button>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.88 }}>🧠 Manual strategy overlay</div>
      <textarea value={manualRule} onChange={(e) => setManualRule(e.target.value)} rows={3}
        placeholder="Example: Watch TSLA this week. Only enter long if price breaks 200 with volume > avg. If it fails, revert to auto."
        style={{
          width: "100%", resize: "vertical", padding: 10, borderRadius: 12,
          border: "1px solid rgba(0,255,200,0.14)", background: "rgba(0,0,0,0.20)", color: "rgba(240,255,250,0.95)",
          outline: "none", marginTop: 8
        }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <button disabled={busy || !manualRule.trim()} onClick={() => run(() => woiApi.setManualRule(manualRule.trim()))} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,255,200,0.22)", background: "rgba(0,255,200,0.10)",
          color: "rgba(220,255,248,0.95)", cursor: "pointer", fontWeight: 900
        }}>✅ Apply Rule</button>
        <button disabled={busy} onClick={() => run(() => woiApi.revertAuto())} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)",
          color: "rgba(240,255,250,0.92)", cursor: "pointer", fontWeight: 900
        }}>↩️ Revert Auto</button>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.88 }}>🧾 Test order (respects mode + guardrails)</div>
      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <input value={tokenId} onChange={(e)=>setTokenId(e.target.value)} placeholder="token_id" style={{
          flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.20)", color: "rgba(240,255,250,0.95)"
        }} />
        <select value={side} onChange={(e)=>setSide(e.target.value)} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.20)", color: "rgba(240,255,250,0.95)"
        }}>
          <option value="buy">buy</option>
          <option value="sell">sell</option>
        </select>
        <input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="price" style={{
          width: 120, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.20)", color: "rgba(240,255,250,0.95)"
        }} />
        <input value={size} onChange={(e)=>setSize(e.target.value)} placeholder="size" style={{
          width: 120, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.20)", color: "rgba(240,255,250,0.95)"
        }} />
        <button onClick={placeTestOrder} disabled={busy || !tokenId.trim()} style={{
          padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,255,200,0.22)", background: "rgba(0,255,200,0.10)",
          color: "rgba(220,255,248,0.95)", cursor: "pointer", fontWeight: 900
        }}>
          🚀 Place Order
        </button>
      </div>
    </div>
  );
}
