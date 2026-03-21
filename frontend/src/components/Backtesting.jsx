// frontend/src/components/Backtesting.jsx
import React, { useState } from "react";
import { API_BASE_URL } from "../config";
import { useTheme } from "../theme/ThemeContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Backtesting = () => {
  const { theme } = useTheme();
  const accent = theme.accent || "#22d3ee";

  const [symbol, setSymbol] = useState("TSLA");
  const [tf, setTf] = useState("1Min");
  const [lookback, setLookback] = useState(1000);
  const [useCrypto, setUseCrypto] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/backtest/basic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          tf,
          lookback_bars: Number(lookback || 1000),
          use_crypto: useCrypto,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setResult(data);
    } catch (e) {
      console.error("backtest error", e);
      setError(e.message || "Backtest failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatPct = (v) => {
    if (v == null || isNaN(v)) return "--";
    const n = Number(v);
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
  };

  const equityData =
    result?.equity_curve?.map((p, idx) => ({
      idx,
      equity: p.equity,
    })) || [];

  return (
    <div
      className="backtesting-root"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px",
        color: "#e5e7eb",
      }}
    >
      <h1 style={{ fontSize: "20px", fontWeight: 600 }}>⏪ Backtesting</h1>

      {/* Controls */}
      <div
        style={{
          borderRadius: "12px",
          background: "#020617",
          border: "1px solid #111827",
          padding: "12px 14px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "10px",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Symbol</div>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            style={{
              marginTop: "4px",
              width: "100%",
              fontSize: "12px",
              padding: "6px 8px",
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Timeframe</div>
          <select
            value={tf}
            onChange={(e) => setTf(e.target.value)}
            style={{
              marginTop: "4px",
              width: "100%",
              fontSize: "12px",
              padding: "6px 8px",
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
            }}
          >
            <option value="1Min">1m</option>
            <option value="5Min">5m</option>
            <option value="15Min">15m</option>
            <option value="1Hour">1h</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Lookback bars</div>
          <input
            type="number"
            min={200}
            value={lookback}
            onChange={(e) => setLookback(e.target.value)}
            style={{
              marginTop: "4px",
              width: "100%",
              fontSize: "12px",
              padding: "6px 8px",
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>

        <div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Asset Type</div>
          <div
            style={{
              marginTop: "4px",
              display: "flex",
              gap: "6px",
            }}
          >
            <button
              onClick={() => setUseCrypto(false)}
              style={{
                flex: 1,
                fontSize: "12px",
                padding: "6px 8px",
                borderRadius: "999px",
                border: "1px solid #1f2937",
                background: useCrypto ? "#020617" : "#111827",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              📊 Stocks
            </button>
            <button
              onClick={() => setUseCrypto(true)}
              style={{
                flex: 1,
                fontSize: "12px",
                padding: "6px 8px",
                borderRadius: "999px",
                border: "1px solid #1f2937",
                background: useCrypto ? "#111827" : "#020617",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              ₿ Crypto
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
          }}
        >
          <button
            onClick={runBacktest}
            disabled={loading}
            style={{
              fontSize: "13px",
              padding: "8px 14px",
              borderRadius: "999px",
              border: "none",
              cursor: loading ? "default" : "pointer",
              background: loading ? "#4b5563" : accent,
              color: "#020617",
              fontWeight: 600,
              marginTop: "18px",
            }}
          >
            {loading ? "Running…" : "Run Backtest"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.4fr)",
          gap: "14px",
          alignItems: "stretch",
        }}
      >
        {/* Stats card */}
        <div
          style={{
            borderRadius: "12px",
            background: "#020617",
            border: "1px solid #111827",
            padding: "12px 14px",
            fontSize: "12px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            Summary
          </div>
          {error && (
            <div style={{ color: "#fca5a5", marginBottom: "4px" }}>{error}</div>
          )}
          {!error && !loading && !result && (
            <div style={{ opacity: 0.7 }}>
              Run a backtest to see performance of the AI signal engine.
            </div>
          )}
          {result && (
            <>
              <div style={{ marginBottom: "4px" }}>
                Symbol: <strong>{result.symbol}</strong>{" "}
                {result.use_crypto ? "(Crypto)" : "(Stock)"}
              </div>
              <div style={{ marginBottom: "4px" }}>
                Total trades: <strong>{result.total_trades}</strong>
              </div>
              <div style={{ marginBottom: "4px" }}>
                Wins: <strong>{result.wins}</strong> · Losses:{" "}
                <strong>{result.losses}</strong>
              </div>
              <div style={{ marginBottom: "4px" }}>
                Win rate:{" "}
                <strong>{formatPct(result.win_rate)}</strong>
              </div>
              <div style={{ marginBottom: "4px" }}>
                Total return:{" "}
                <strong
                  style={{
                    color:
                      result.total_return_pct >= 0 ? "#22c55e" : "#ef4444",
                  }}
                >
                  {formatPct(result.total_return_pct)}
                </strong>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  maxHeight: "180px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Trades
                </div>
                {result.trades.length === 0 && (
                  <div style={{ opacity: 0.6 }}>No trades placed.</div>
                )}
                {result.trades.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "4px 0",
                      borderBottom: "1px solid #111827",
                    }}
                  >
                    <div>
                      #{idx + 1} {t.side} @{" "}
                      {t.entry_price?.toFixed
                        ? t.entry_price.toFixed(2)
                        : t.entry_price}{" "}
                      →{" "}
                      {t.exit_price?.toFixed
                        ? t.exit_price.toFixed(2)
                        : t.exit_price}
                    </div>
                    <div
                      style={{
                        color:
                          t.return_pct >= 0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {formatPct(t.return_pct)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Equity curve */}
        <div
          style={{
            borderRadius: "12px",
            background: "#020617",
            border: "1px solid #111827",
            padding: "12px 14px",
            fontSize: "12px",
            minHeight: "220px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            Equity Curve
          </div>
          {result && equityData.length > 0 ? (
            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData}>
                  <XAxis dataKey="idx" hide />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    stroke="#4b5563"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid #4b5563",
                      fontSize: 11,
                    }}
                    labelFormatter={(idx) => `Step ${idx}`}
                    formatter={(val) => [val.toFixed(3), "Equity"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke={accent}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>
              Equity curve will show here after a successful backtest.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backtesting;
