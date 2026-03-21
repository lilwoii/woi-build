import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";
import { useDemoMode } from "../context/DemoModeContext";
import RssNewsBar from "./RssNewsBar";

/**
 * Prediction Markets tab (Kalshi demo first + Polymarket scaffold).
 * - Mirror UI + search + bot control.
 * - Demo mode simulates scanning/decisions/trades.
 * - Polymarket "Connect Wallet" is UI-only scaffold (backend can be wired later).
 */
const PredictionMarkets = () => {
  const { demoMode } = useDemoMode();

  const [pollSec, setPollSec] = useState(10);
  const [provider, setProvider] = useState("kalshi"); // kalshi | polymarket
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [searching, setSearching] = useState(false);

  // Market Browser (UI helper)
  const [browseItems, setBrowseItems] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  const [tokenId, setTokenId] = useState("");
  const [paper, setPaper] = useState(true);
  const [maxSize, setMaxSize] = useState(1);

  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // "Poll" = polling interval (how often we refresh markets/odds/status)
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setBrowseLoading(true);
      try {
        const url = `${API_BASE_URL}/prediction/markets?source=${provider}&q=${encodeURIComponent(q)}&limit=25&offset=0`;
        const r = await fetch(url);
        const j = await r.json();
        if (!alive) return;
        setBrowseItems(j.items || []);
      } catch (e) {
        if (alive) setBrowseItems([]);
      } finally {
        if (alive) setBrowseLoading(false);
      }
    };
    run();
    const t = setInterval(run, Math.max(3, Number(pollSec) || 10) * 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [provider, q, pollSec]);

// Bot control

  // Polymarket connect wallet (scaffold)
  const [walletModal, setWalletModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddr, setWalletAddr] = useState(null);

  const prettyProvider = provider === "polymarket" ? "Polymarket" : "Kalshi";

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pm/bot/status`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setStatus({ error: "Failed to fetch status." });
    } finally {
      setStatusLoading(false);
    }
  };

  // Demo-mode simulated status ticker
  useEffect(() => {
    if (!demoMode) return;
    setStatus({ running: true, provider, paper: true, demo: true, last_decision: null });

    const id = setInterval(() => {
      const signals = ["BUY", "SELL", "NEUTRAL"];
      const signal = signals[Math.floor(Math.random() * signals.length)];
      const conf = 0.55 + Math.random() * 0.42;
      const mid = 0.35 + Math.random() * 0.55;
      setStatus((prev) => ({
        ...(prev || {}),
        running: true,
        provider,
        paper: true,
        demo: true,
        last_decision: {
          signal,
          confidence: conf,
          mid_price: mid,
          reason:
            signal === "BUY"
              ? "Momentum + mispricing vs headline risk" 
              : signal === "SELL"
              ? "Reversion risk + spread widening"
              : "No edge: spread too wide / news uncertainty",
        },
      }));
    }, 2500);

    return () => clearInterval(id);
  }, [demoMode, provider]);

  useEffect(() => {
    if (demoMode) return;
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, [demoMode]);

  const search = async () => {
    setSearching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/pm/markets/search?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(
          q
        )}&limit=20`
      );
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setItems([]);
    } finally {
      setSearching(false);
    }
  };

  const startBot = async () => {
    if (!tokenId.trim()) return;
    if (provider === "polymarket" && !walletConnected) {
      setWalletModal(true);
      return;
    }
    await fetch(`${API_BASE_URL}/pm/bot/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        token_id: tokenId.trim(),
        paper,
        poll_sec: Number(pollSec),
        max_position_size: Number(maxSize),
        send_to_discord: true,
      }),
    });
    fetchStatus();
  };

  const stopBot = async () => {
    await fetch(`${API_BASE_URL}/pm/bot/stop`, { method: "POST" });
    fetchStatus();
  };

  const connectWallet = async () => {
    // UI-first: when you wire real Polymarket later, replace with actual connect flow.
    try {
      const res = await fetch(`${API_BASE_URL}/pm/polymarket/connect`, { method: "POST" });
      const data = await res.json();
      setWalletConnected(Boolean(data?.connected));
      setWalletAddr(data?.address || "0xDEMO…WALLET");
    } catch {
      setWalletConnected(true);
      setWalletAddr("0xDEMO…WALLET");
    } finally {
      setWalletModal(false);
    }
  };

  const demoHint = useMemo(() => {
    if (!demoMode) return null;
    return {
      title: "🎬 Demo mode is ON",
      body:
        "The bot will simulate: scanning markets, ranking edges, placing paper trades, and posting Discord-friendly alerts.",
    };
  }, [demoMode]);

  return (
    <div style={{ padding: 16, color: "#e5e7eb" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎲 Prediction Markets</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Kalshi-first demo. Polymarket is scaffolded with a clean “Connect Wallet” flow.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              borderRadius: 999,
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              padding: "8px 10px",
              fontSize: 12,
            }}
          >
            <option value="kalshi">Kalshi</option>
            <option value="polymarket">Polymarket</option>
          </select>

          {provider === "polymarket" && (
            <button
              onClick={() => setWalletModal(true)}
              style={{
                borderRadius: 999,
                border: "1px solid #22c55e",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
              title="Connect wallet to trade on Polymarket"
            >
              {walletConnected ? `✅ ${walletAddr || "Connected"}` : "🔌 Connect Wallet"}
            </button>
          )}

          <button
            onClick={fetchStatus}
            style={{
              borderRadius: 999,
              border: "1px solid #38bdf8",
              background: "#020617",
              color: "#e5e7eb",
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {statusLoading ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {demoHint && (
        <div
          style={{
            border: "1px solid #1f2933",
            background: "rgba(2,6,23,0.7)",
            borderRadius: 14,
            padding: "10px 12px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>{demoHint.title}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{demoHint.body}</div>
        </div>
      )}

      {/* Bot control */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid #111827",
          background: "#020617",
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
          Bot control (automated trades + Discord alerts)
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="token_id / ticker / condition_id"
            style={{
              minWidth: 280,
              flex: 1,
              borderRadius: 999,
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              padding: "8px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <input type="checkbox" checked={paper} onChange={() => setPaper(!paper)} />
            paper
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ color: "#94a3b8" }}>poll</span>
            <input
              value={pollSec}
              onChange={(e) => setPollSec(e.target.value)}
              type="number"
              min="2"
              style={{
                width: 76,
                borderRadius: 10,
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "6px 8px",
                fontSize: 12,
              }}
            />
            <span style={{ color: "#94a3b8" }}>sec</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ color: "#94a3b8" }}>max size</span>
            <input
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              type="number"
              min="0.1"
              step="0.1"
              style={{
                width: 86,
                borderRadius: 10,
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "6px 8px",
                fontSize: 12,
              }}
            />
          </div>

          <button
            onClick={startBot}
            style={{
              borderRadius: 999,
              border: "none",
              background: "#16a34a",
              color: "#0b1120",
              fontWeight: 800,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            ▶ Start
          </button>
          <button
            onClick={stopBot}
            style={{
              borderRadius: 999,
              border: "none",
              background: "#b91c1c",
              color: "#f9fafb",
              fontWeight: 800,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            ■ Stop
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#cbd5e1" }}>
          <div>
            <span style={{ color: "#94a3b8" }}>Status: </span>
            {status?.running ? "🟢 running" : "🔴 stopped"}{" "}
            <span style={{ color: "#94a3b8" }}>| provider:</span> {status?.provider || prettyProvider}
            {status?.demo && <span style={{ marginLeft: 8, color: "#22c55e" }}>🔥 demo</span>}
          </div>
          {status?.last_decision && (
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
              🎯 Last decision: {status.last_decision.signal} (conf{" "}
              {Number(status.last_decision.confidence || 0).toFixed(2)}) · mid{" "}
              {Number(status.last_decision.mid_price || 0).toFixed(3)}
              {status.last_decision.reason ? `\n🧾 ${status.last_decision.reason}` : ""}
            </div>
          )}
          {status?.error && <div style={{ marginTop: 6, color: "#f87171" }}>❌ {status.error}</div>}
        </div>
      </div>

      {/* Market search */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid #111827",
          background: "#020617",
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search markets (ex: election, inflation, bitcoin...)"
            style={{
              flex: 1,
              borderRadius: 999,
              border: "1px solid #1f2933",
              background: "#020617",
              color: "#e5e7eb",
              padding: "8px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button
            onClick={search}
            style={{
              borderRadius: 999,
              border: "1px solid #38bdf8",
              background: "#020617",
              color: "#e5e7eb",
              padding: "8px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {searching ? "…" : "Search"}
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
          Tip: click a result to copy its id into the bot control above.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setTokenId(String(it.id || ""))}
              style={{
                textAlign: "left",
                borderRadius: 14,
                border: "1px solid #111827",
                background: "#0b1220",
                color: "#e5e7eb",
                padding: "10px 12px",
                cursor: "pointer",
              }}
              title="Use this market id"
            >
              <div style={{ fontSize: 12, fontWeight: 800 }}>{it.title || it.id}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{it.id}</div>
            </button>
          ))}
          {!searching && items.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>No results yet.</div>}
        </div>
      </div>

      {/* AI News */}
      <RssNewsBar query={q || "prediction markets"} limit={5} title="AI News Summary" />

      {/* Wallet modal */}
      {walletModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setWalletModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              maxWidth: "92vw",
              borderRadius: 18,
              border: "1px solid #1f2933",
              background: "#020617",
              padding: 14,
              boxShadow: "0 0 40px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900 }}>🔌 Connect Wallet</div>
              <button
                onClick={() => setWalletModal(false)}
                style={{ border: "none", background: "transparent", color: "#e5e7eb", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
              For now this is a clean Polymarket-style connect flow. Later you can wire a real wallet connection
              (e.g. WalletConnect) or key-based auth.
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={connectWallet}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  background: "#22c55e",
                  color: "#0b1120",
                  fontWeight: 900,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Connect
              </button>
              <button
                onClick={() => setWalletModal(false)}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid #1f2933",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontWeight: 800,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionMarkets;