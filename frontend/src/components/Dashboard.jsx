import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { API_BASE_URL, WS_URL } from "../config";
import Chart from "./Chart";
import UserMenu from "./UserMenu";
import TradingViewWidget from "./TradingViewWidget";
import KPIStrip from "./KPIStrip";
import AIChatWidget from "./AIChatWidget";
import RssNewsBar from "./RssNewsBar";
import StreakBadge from "./StreakBadge";
import { useAIMode } from "../context/AIModeContext";
import { useDemoMode } from "../context/DemoModeContext";


const Dashboard = () => {
  const [symbol, setSymbol] = useState("TSLA");
  const [inputSymbol, setInputSymbol] = useState("TSLA");
  const { aiMode } = useAIMode();
  const { demoMode, setDemoMode } = useDemoMode();


  const [price, setPrice] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [aiInsight, setAiInsight] = useState(null);
  const demoInsight = { signal: 'BUY', confidence: 78, reason: 'Breakout + higher highs. Demo auto-trendline suggests bullish bias. Run Scan for live analysis.' };
  const [aiLoading, setAiLoading] = useState(false);

  const [watchlist, setWatchlist] = useState([]);
  const [watchlistUpdating, setWatchlistUpdating] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [wsStatus, setWsStatus] = useState("disconnected");

  const [newWatchSymbol, setNewWatchSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("1D");

  // chart view toggle: "ai" | "tv"
  const [chartMode, setChartMode] = useState("ai");

  const [rightPanelTab, setRightPanelTab] = useState("insight");
  const [showDailyBrief, setShowDailyBrief] = useState(false);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [dailyBriefLoading, setDailyBriefLoading] = useState(false);

  const [quickLoading, setQuickLoading] = useState(false);

  // settings (paper vs live)
  const [usePaper, setUsePaper] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [newAlertPrice, setNewAlertPrice] = useState("");
  const [newAlertDirection, setNewAlertDirection] = useState("above");

  const wsRef = useRef(null);
  const chartRef = useRef(null);

  // ---------------------------
  // Helpers
  // ---------------------------
  const pushNotification = (message) => {
    setNotifications((prev) => [
      { id: Date.now(), message },
      ...prev.slice(0, 49),
    ]);
  };

  
  // ---------------------------
  // DEMO MODE: simulation
  // ---------------------------
  useEffect(() => {
    if (!demoMode) return;

    // lock chart to AI chart during demo so users see overlays/analysis behavior
    setChartMode("ai");

    let p = price != null ? Number(price) : 100;
    const samples = [
      {
        signal: "BUY",
        confidence: 0.78,
        summary:
          "DEMO: Breakout + higher highs. AI suggests a staged entry with tight risk and a partial take-profit near the next resistance.",
      },
      {
        signal: "NEUTRAL",
        confidence: 0.55,
        summary:
          "DEMO: Range conditions. AI suggests waiting for confirmation or scalping only with strict stops.",
      },
      {
        signal: "SELL",
        confidence: 0.74,
        summary:
          "DEMO: Trend exhaustion + lower highs. AI suggests reducing exposure or hedging until structure improves.",
      },
    ];

    let i = 0;
    const tick = () => {
      // simple random walk price
      const drift = (Math.random() - 0.5) * 1.2;
      p = Math.max(1, p + drift);
      setPrice(p);

      const s = samples[i % samples.length];
      setAiInsight({
        ...s,
        symbol,
        demo: true,
        ts: Date.now(),
      });

      if (i % 2 === 0) {
        pushNotification(`🎬 DEMO: ${s.signal} (conf ${(s.confidence * 100).toFixed(0)}%) · simulated decision for ${symbol}`);
      } else {
        pushNotification(`🎬 DEMO: simulated execution & Discord snapshot for ${symbol}`);
      }

      i += 1;
    };

    // fire immediately and then loop
    tick();
    const id = setInterval(tick, 4500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, symbol]);

// ---------------------------
// WebSocket handling
// ---------------------------
useEffect(() => {
  if (!WS_URL || demoMode || !symbol) return;

  let ws = null;
  let closed = false;

  try {
    setWsStatus("connecting");
    ws = new WebSocket(`${WS_URL}?symbol=${encodeURIComponent(symbol)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!closed) setWsStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "price_update" || data.type === "tick") {
          if (data.price != null) setPrice(data.price);
        }

        if (data.type === "notification") {
          setNotifications((prev) => [
            { id: Date.now(), message: data.message ?? "New notification" },
            ...prev.slice(0, 49),
          ]);
        }

        if (data.type === "ai_insight") {
          setAiInsight(data.payload || data);
        }
      } catch (err) {
        console.warn("WS message parse error:", err);
      }
    };

    ws.onerror = () => {
      if (!closed) setWsStatus("error");
      console.warn("WebSocket unavailable");
    };

    ws.onclose = () => {
      if (!closed) setWsStatus("disconnected");
    };
  } catch (err) {
    console.warn("WebSocket init failed:", err);
    setWsStatus("error");
  }

  return () => {
    closed = true;
    try {
      if (ws) ws.close();
    } catch {}
  };
}, [symbol, demoMode]);

  // ---------------------------
  // Initial settings + alerts
  // ---------------------------
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.use_paper === "boolean") {
            setUsePaper(data.use_paper);
          }
        }
      } catch (err) {
        console.error("Error loading settings", err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const loadAlerts = async () => {
      setAlertsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/alerts?symbol=${encodeURIComponent(symbol)}`
        );
        if (res.ok) {
          const data = await res.json();
          setAlerts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error loading alerts", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    loadAlerts();
  }, [symbol]);

  // ---------------------------
// Load initial dashboard data
// ---------------------------
useEffect(() => {
  const fetchInitial = async () => {
    try {
      // price
      const priceRes = await fetch(
        `${API_BASE_URL}/price?symbol=${encodeURIComponent(symbol)}`
      );
      if (priceRes.ok) {
        const data = await priceRes.json();
        if (data && data.price != null) {
          setPrice(data.price);
        }
      } else {
        console.warn("Price endpoint failed:", priceRes.status);
      }

      // watchlist
      const wlRes = await fetch(`${API_BASE_URL}/watchlist`);
      if (wlRes.ok) {
        const data = await wlRes.json();
        setWatchlist(Array.isArray(data) ? data : []);
      } else {
        console.warn("Watchlist endpoint failed:", wlRes.status);
        setWatchlist([]);
      }

      // notifications (optional)
      const notifRes = await fetch(`${API_BASE_URL}/notifications`);
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (Array.isArray(data)) {
          setNotifications(
            data
              .map((n, idx) => ({
                id: n.id ?? idx,
                message: n.message ?? String(n),
              }))
              .slice(-50)
              .reverse()
          );
        } else {
          setNotifications([]);
        }
      } else if (notifRes.status === 404) {
        console.warn("Notifications endpoint not available yet.");
        setNotifications([]);
      } else {
        console.warn("Notifications endpoint failed:", notifRes.status);
      }
    } catch (err) {
      console.error("Error loading initial dashboard data", err);
      setWatchlist([]);
      setNotifications([]);
    }
  };

  fetchInitial();
}, [symbol]);

  // ---------------------------
  // Symbol handling
  // ---------------------------
  const handleSymbolSubmit = (e) => {
    e.preventDefault();
    const clean = inputSymbol.trim().toUpperCase();
    if (!clean) return;
    setSymbol(clean);
  };

  // ---------------------------
  // AI insight helper (Scan button)
  // ---------------------------
  const runAIInsight = async (mode = "default") => {
    if (!symbol) return;

    setAiLoading(true);
    setAiInsight(null);
    try {
      const url = `${API_BASE_URL}/ai/insight?symbol=${encodeURIComponent(
        symbol
      )}&mode=${encodeURIComponent(mode)}&ai_mode=${encodeURIComponent(aiMode)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data);
      } else {
        setAiInsight({
          summary: "AI analysis failed. Please try again.",
        });
      }
    } catch (err) {
      console.error("AI insight error", err);
      setAiInsight({
        summary: "AI analysis error. Check backend logs.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // ---------------------------
  // Paper vs Live toggle
  // ---------------------------
  const togglePaperMode = async () => {
    if (settingsLoading) return;
    const next = !usePaper;
    setSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_paper: next }),
      });
      if (res.ok) {
        const data = await res.json();
        const value =
          typeof data.use_paper === "boolean" ? data.use_paper : next;
        setUsePaper(value);
        pushNotification(
          value
            ? "🧪 Switched to PAPER trading."
            : "💵 Switched to LIVE trading."
        );
      } else {
        pushNotification("❌ Failed to update trading mode.");
      }
    } catch (err) {
      console.error("Toggle paper/live error", err);
      pushNotification("❌ Failed to update trading mode.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // ---------------------------
  // Chart screenshot helper
  // ---------------------------
  const captureChartBlob = async () => {
    if (!chartRef.current) return null;
    try {
      const canvas = await html2canvas(chartRef.current, {
        useCORS: true,
        backgroundColor: "#020617",
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      return blob;
    } catch (err) {
      console.error("Chart capture failed", err);
      return null;
    }
  };

  // ---------------------------
  // Quick trade helpers
  // ---------------------------
  const handleQuickBuyAI = async () => {
    if (!symbol || quickLoading) return;
    setQuickLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/quick_buy_ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (res.ok && data?.ok) {
        pushNotification(`🧠 Quick BUY AI executed for ${symbol}.`);
      } else {
        const reason =
          data?.reason || data?.error || "Signal not strong BUY.";
        pushNotification(`⚠️ Quick BUY skipped for ${symbol}: ${reason}`);
      }
    } catch (err) {
      console.error("Quick BUY error", err);
      pushNotification(`❌ Quick BUY failed for ${symbol}.`);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickSellAll = async () => {
    if (!symbol || quickLoading) return;
    setQuickLoading(true);
    try {
      // 1) Trend analysis for snapshot
      let trendData = null;
      try {
        const trendRes = await fetch(`${API_BASE_URL}/ai/trend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol,
            tf: "1Min",
            limit: 400,
            heavy: false,
            send_to_discord: false,
          }),
        });
        if (trendRes.ok) {
          trendData = await trendRes.json();
        }
      } catch (err) {
        console.error("Trend analysis error", err);
      }

      // 2) Capture chart screenshot
      const blob = await captureChartBlob();

      // 3) Send snapshot to Discord (chart + analysis)
      if (trendData || blob) {
        const form = new FormData();
        form.append("symbol", symbol);
        form.append("analysis", JSON.stringify(trendData || {}));
        if (blob) {
          form.append("file", blob, `${symbol}_chart.png`);
        }

        try {
          const snapRes = await fetch(`${API_BASE_URL}/ai/trend/snapshot`, {
            method: "POST",
            body: form,
          });
          if (!snapRes.ok) {
            console.warn("Trend snapshot failed");
          }
        } catch (err) {
          console.error("Snapshot upload error", err);
        }
      }

      // 4) Actually close the position
      const res = await fetch(`${API_BASE_URL}/orders/quick_sell_all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        // ignore
      }

      if (res.ok && data?.ok) {
        pushNotification(`🔴 Quick SELL + snapshot executed for ${symbol}.`);
      } else {
        const reason =
          data?.error || "No open position or broker error.";
        pushNotification(
          `⚠️ Quick SELL snapshot skipped for ${symbol}: ${reason}`
        );
      }
    } catch (err) {
      console.error("Quick SELL snapshot error", err);
      pushNotification(`❌ Quick SELL + snapshot failed for ${symbol}.`);
    } finally {
      setQuickLoading(false);
    }
  };

  
  // ---------------------------
  // Daily brief (top-right pill)
  // ---------------------------
  const openDailyBrief = async () => {
  setShowDailyBrief(true);
  if (dailyBriefLoading) return;

  setDailyBriefLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/ai/daily-brief`);

    if (!res.ok) {
      throw new Error(`Daily brief failed: HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Daily brief returned non-JSON: ${text.slice(0, 120)}`);
    }

    const data = await res.json();
    setDailyBrief(data);
  } catch (e) {
    console.error(e);
    setDailyBrief({
      ok: false,
      title: "Daily Brief",
      content: "Failed to load daily brief. Check backend.",
    });
  } finally {
    setDailyBriefLoading(false);
  }
};
// ---------------------------
  // Watchlist
  // ---------------------------
  const handleAddWatchlist = async (e) => {
    e.preventDefault();
    const clean = newWatchSymbol.trim().toUpperCase();
    if (!clean) return;

    setWatchlistUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: clean }),
      });

      if (res.ok) {
        const updated = await res.json();
        setWatchlist((prev) => {
          const others = prev.filter((w) => w.symbol !== updated.symbol);
          return [...others, updated];
        });
        setNewWatchSymbol("");
      }
    } catch (err) {
      console.error("Error adding to watchlist", err);
    } finally {
      setWatchlistUpdating(false);
    }
  };

  const handleDeleteWatchItem = async (item) => {
    setWatchlistUpdating(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/watchlist/${encodeURIComponent(item.symbol)}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setWatchlist((prev) =>
          prev.filter((w) => w.symbol !== item.symbol)
        );
      }
    } catch (err) {
      console.error("Error deleting watchlist item", err);
    } finally {
      setWatchlistUpdating(false);
    }
  };

  // ---------------------------
  // Alerts
  // ---------------------------
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    const priceVal = parseFloat(newAlertPrice);
    if (!symbol || Number.isNaN(priceVal)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          direction: newAlertDirection,
          price: priceVal,
          enabled: true,
        }),
      });

      if (res.ok) {
        const rule = await res.json();
        setAlerts((prev) => [...prev, rule]);
        setNewAlertPrice("");
        pushNotification(
          `🔔 Alert set for ${symbol}: ${newAlertDirection} ${priceVal.toFixed(
            2
          )}`
        );
      }
    } catch (err) {
      console.error("Create alert error", err);
      pushNotification("❌ Failed to create alert.");
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete alert error", err);
    }
  };

  // ---------------------------
  // Timeframe
  // ---------------------------
  const timeframes = ["1D", "1W", "1M", "3M", "1Y"];

  // ---------------------------
  // AI display helper
  // ---------------------------
  const signal = (aiInsight && aiInsight.signal) || "NEUTRAL";
  const confRaw = aiInsight && typeof aiInsight.confidence === "number" ? aiInsight.confidence : null;
  const confPct = confRaw !== null ? Math.round(confRaw * 100) : null;
  const confColor = confPct === null ? "#9ca3af" : confPct >= 75 ? "#22c55e" : confPct >= 55 ? "#eab308" : "#ef4444";

  let signalColor = "#38bdf8";
  if (signal === "BUY") signalColor = "#22c55e";
  if (signal === "SELL") signalColor = "#ef4444";

  return (
    <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2.5fr 1.4fr",
        gap: "16px",
        height: "100%",
        padding: "16px",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: 0,
        }}
      >
        <KPIStrip />

        {/* Top bar: symbol + ws status + paper/live */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <form
            onSubmit={handleSymbolSubmit}
            style={{ display: "flex", gap: "8px", flex: 1 }}
          >
            <input
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              placeholder="Symbol (TSLA, AAPL, BTCUSD...)"
              style={{
                flex: 1,
                borderRadius: "999px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                borderRadius: "999px",
                border: "1px solid #1d4ed8",
                background:
                  "radial-gradient(circle at top left, #22c55e, #0ea5e9, #6366f1)",
                color: "#0b1120",
                fontWeight: 600,
                padding: "8px 16px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Load
            </button>
          </form>

          <div
            style={{
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "999px",
              border: "1px solid #1f2933",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#020617",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background:
                  wsStatus === "connected"
                    ? "#22c55e"
                    : wsStatus === "connecting"
                    ? "#eab308"
                    : "#ef4444",
              }}
            />
            <span style={{ textTransform: "capitalize" }}>
              {wsStatus}
            </span>
          </div>

          <StreakBadge kind="stocks" />

          <button
            onClick={togglePaperMode}
            disabled={settingsLoading}
            style={{
              borderRadius: "999px",
              border: "1px solid #111827",
              padding: "4px 12px",
              fontSize: "12px",
              cursor: settingsLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: usePaper ? "#020617" : "#111827",
              boxShadow: usePaper
                ? "0 0 0 1px rgba(148, 163, 184, 0.4)"
                : "0 0 0 1px rgba(248, 113, 113, 0.5)",
              opacity: settingsLoading ? 0.6 : 1,
            }}
            title="Toggle Paper vs Live trading"
          >
            <span>{usePaper ? "🧪" : "💵"}</span>
            <span>{usePaper ? "Paper" : "Live"}</span>
          </button>

          <button
            onClick={() => setDemoMode((v) => !v)}
            style={{
              borderRadius: "999px",
              border: demoMode ? "1px solid #f59e0b" : "1px solid #111827",
              padding: "4px 12px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#020617",
              boxShadow: demoMode
                ? "0 0 0 1px rgba(245, 158, 11, 0.45)"
                : "none",
            }}
            title="Demo mode shows simulated AI behavior across the app"
          >
            <span>{demoMode ? "🟠" : "⚪"}</span>
            <span>{demoMode ? "Demo: ON" : "Demo: OFF"}</span>
          </button>
        </div>

        {/* Price + timeframe + quick trade */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            <span style={{ fontWeight: 500 }}>{symbol}</span>
            {price != null && (
              <span style={{ marginLeft: "8px", fontSize: "16px" }}>
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <div
              style={{
                display: "flex",
                gap: "6px",
              }}
            >
              <button
                onClick={handleQuickBuyAI}
                disabled={quickLoading}
                style={{
                  borderRadius: "999px",
                  border: "none",
                  padding: "6px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                  background: "#16a34a",
                  color: "#0b1120",
                  fontWeight: 600,
                  opacity: quickLoading ? 0.6 : 1,
                }}
              >
                🧠 Quick Buy AI
              </button>
              <button
                onClick={handleQuickSellAll}
                disabled={quickLoading}
                style={{
                  borderRadius: "999px",
                  border: "none",
                  padding: "6px 14px",
                  fontSize: "12px",
                  cursor: "pointer",
                  background: "#b91c1c",
                  color: "#f9fafb",
                  fontWeight: 600,
                  opacity: quickLoading ? 0.6 : 1,
                }}
              >
                📸 Quick Sell + Snap
              </button>
            </div>
          </div>
        </div>

        {/* Main chart */}
        <div
          ref={chartRef}
          style={{
            flex: 1,
            // Let the chart fill the remaining viewport height
            height: "calc(100vh - 230px)",
            minHeight: "520px",
            borderRadius: "16px",
            border: "1px solid #111827",
            background:
              "radial-gradient(circle at top, #020617, #020617 40%, #020617)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", gap: 8, padding: "10px 10px 0" }}>
  <button
    onClick={() => setChartMode("ai")}
    style={{
      padding: "6px 12px",
      borderRadius: "999px",
      border: chartMode === "ai" ? "1px solid #38bdf8" : "1px solid #111827",
      background: "#020617",
      color: "#e5e7eb",
      fontSize: "12px",
      cursor: "pointer",
      boxShadow:
        chartMode === "ai" ? "0 0 0 1px rgba(56, 189, 248, 0.45)" : "none",
    }}
    title="AI-native chart (supports overlays / auto-draw)"
  >
    🧠 AI Chart
  </button>
  <button
    onClick={() => setChartMode("tv")}
    style={{
      padding: "6px 12px",
      borderRadius: "999px",
      border: chartMode === "tv" ? "1px solid #38bdf8" : "1px solid #111827",
      background: "#020617",
      color: "#e5e7eb",
      fontSize: "12px",
      cursor: "pointer",
      boxShadow:
        chartMode === "tv" ? "0 0 0 1px rgba(56, 189, 248, 0.45)" : "none",
    }}
    title="TradingView widget (comfort chart)"
  >
    📈 TradingView
  </button>
</div>

	<div style={{ padding: "10px", flex: 1, minHeight: 0, flex: 1 }}>
  {chartMode === "tv" ? (
    <TradingViewWidget
      symbol={symbol.length > 6 ? symbol : `NASDAQ:${symbol}`}
	      height="100%"
    />
  ) : (
    <Chart symbol={symbol} timeframe={timeframe} autoRefresh={autoRefresh} />
  )}
</div>
</div>





        {/* AI News (RSS) */}
        <RssNewsBar query={symbol} tickers={[symbol, ...(watchlist||[]).map(w => (w.symbol||w.ticker||w.id||"")).filter(Boolean)]} limit={5} title="AI News Summary" />
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: 0,
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <UserMenu />
          <button
            onClick={openDailyBrief}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.55)",
              color: "#e5e7eb",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
            }}
            title="Daily brief"
          >
            🗞 Daily Brief
          </button>

          {[
            { id: "insight", label: "AI Insight", icon: "🧠" },
            { id: "alerts", label: "Alerts", icon: "🔔" },
            { id: "theme", label: "Theme", icon: "⚙️" },
          ].map((tab) => {
            const active = rightPanelTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRightPanelTab(tab.id)}
                style={{
                  padding: "6px 18px",
                  borderRadius: "999px",
                  border: active
                    ? "1px solid #38bdf8"
                    : "1px solid #111827",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  boxShadow: active
                    ? "0 0 0 1px rgba(56, 189, 248, 0.45)"
                    : "0 0 0 0 transparent",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {rightPanelTab === "insight" && (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid #111827",
              background:
                "radial-gradient(circle at top left, #020617, #020617 40%, #020617)",
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "18px" }}>🧠</span>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#e5e7eb",
                    }}
                  >
                    AI Insight – {symbol}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    Heuristic:{" "}
                    <span style={{ color: signalColor, fontWeight: 600 }}>
                      {signal}
                    </span>
                    {confPct !== null && (
                      <span style={{ color: "#9ca3af" }}>
                        {" "}
                        · conf <span style={{ color: confColor, fontWeight: 700 }}>{confPct}%</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => runAIInsight("default")}
                  disabled={aiLoading}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: "1px solid #38bdf8",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    opacity: aiLoading ? 0.6 : 1,
                  }}
                  title="Run AI insight scan"
                >
                  <span>🧠</span>
                  <span>{aiLoading ? "Scanning…" : "Scan"}</span>
                </button>

                <div
                  style={{
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#22c55e",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#22c55e",
                    }}
                  />
                  <span>live</span>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "12px",
                maxHeight: "140px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {aiLoading && (
                <div style={{ opacity: 0.7 }}>
                  🧠 AI is thinking about {symbol}…
                </div>
              )}
              {!aiLoading && aiInsight?.summary && (
                <div>{aiInsight.summary}</div>
              )}
              {!aiLoading && !aiInsight?.summary && (
                <div style={{ opacity: 0.6 }}>
                  No hybrid trend yet — hit <strong>Scan</strong> to
                  generate fresh analysis. The same insight will be
                  formatted for Discord.
                </div>
              )}
            </div>
          </div>
        )}

        {rightPanelTab === "alerts" && (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid #111827",
              background: "#020617",
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#e5e7eb",
                marginBottom: "6px",
              }}
            >
              🔔 Price Alerts – {symbol}
            </div>

            <form
              onSubmit={handleCreateAlert}
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <select
                value={newAlertDirection}
                onChange={(e) => setNewAlertDirection(e.target.value)}
                style={{
                  borderRadius: "999px",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "6px 10px",
                  fontSize: "12px",
                }}
              >
                <option value="above">📈 Above</option>
                <option value="below">📉 Below</option>
              </select>
              <input
                value={newAlertPrice}
                onChange={(e) => setNewAlertPrice(e.target.value)}
                placeholder="Price"
                type="number"
                step="0.01"
                style={{
                  flex: 1,
                  borderRadius: "999px",
                  border: "1px solid #1f2933",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "6px 10px",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  borderRadius: "999px",
                  border: "1px solid #38bdf8",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "6px 16px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </form>

            <div
              style={{
                fontSize: "12px",
                maxHeight: "140px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {alertsLoading && (
                <div style={{ opacity: 0.7 }}>Loading alerts…</div>
              )}

              {!alertsLoading && alerts.length === 0 && (
                <div style={{ opacity: 0.6 }}>
                  No alerts yet for {symbol}. Create one above and the
                  backend will watch price and ping Discord when it
                  triggers. 🔔
                </div>
              )}

              {alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px dashed #111827",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span>
                      {a.direction === "above" ? "📈 Above" : "📉 Below"}{" "}
                      {Number(a.price).toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: a.enabled ? "#22c55e" : "#64748b",
                      }}
                    >
                      {a.enabled ? "Active" : "Triggered / Disabled"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(a.id)}
                    style={{
                      borderRadius: "999px",
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      width: "24px",
                      height: "24px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                    title="Delete alert"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {rightPanelTab === "theme" && (
          <div
            style={{
              borderRadius: "14px",
              border: "1px solid #111827",
              background: "#020617",
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#e5e7eb",
                marginBottom: "4px",
              }}
            >
              ⚙️ Theme
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>
              Future spot for theme presets and custom colors. For now
              the dashboard stays in your default dark sci-fi look. 🌌
            </div>
          </div>
        )}

        {/* Watchlist */}
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid #111827",
            background: "#020617",
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#e5e7eb",
                }}
              >
                Watchlist
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "2px",
                }}
              >
                Live price • % change • mini trend
              </div>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
              }}
            >
              {watchlistUpdating ? "updating…" : "live"}
            </div>
          </div>

          <form
            onSubmit={handleAddWatchlist}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <input
              value={newWatchSymbol}
              onChange={(e) =>
                setNewWatchSymbol(e.target.value.toUpperCase())
              }
              placeholder="Add symbol (e.g. NVDA)"
              style={{
                flex: 1,
                borderRadius: "999px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "6px 12px",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={watchlistUpdating}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "999px",
                border: "1px solid #38bdf8",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "18px",
                lineHeight: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 1px rgba(56, 189, 248, 0.45)",
                opacity: watchlistUpdating ? 0.6 : 1,
              }}
            >
              +
            </button>
          </form>

          <div
            style={{
              maxHeight: "180px",
              overflowY: "auto",
              paddingRight: "4px",
              fontSize: "12px",
            }}
          >
            {watchlist.length === 0 && (
              <div style={{ opacity: 0.6 }}>
                Nothing here yet. Add a symbol above to track price,
                % change and trend.
              </div>
            )}

            {watchlist.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1.3fr 1fr 1.6fr 32px",
                  padding: "0 4px 4px",
                  marginBottom: "4px",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                <div>Symbol</div>
                <div>Price</div>
                <div>%</div>
                <div>Trend</div>
                <div />
              </div>
            )}

            {watchlist.map((item) => {
              const pct = item.change_percent ?? item.change_pct;
              let pctColor = "#e5e7eb";
              let pctPrefix = "";
              let trendEmoji = "➖";

              if (typeof pct === "number") {
                if (pct > 0) {
                  pctColor = "#22c55e";
                  pctPrefix = "+";
                  trendEmoji = "📈";
                } else if (pct < 0) {
                  pctColor = "#ef4444";
                  trendEmoji = "📉";
                }
              }

              const priceValue =
                item.price != null
                  ? item.price
                  : item.last_price != null
                  ? item.last_price
                  : null;

              return (
                <div
                  key={item.symbol}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1.3fr 1fr 1.6fr 32px",
                    alignItems: "center",
                    padding: "6px 4px",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #020617, #020617)",
                    border: "1px solid #111827",
                    marginBottom: "4px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {item.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.7,
                      }}
                    >
                      {item.name || ""}
                    </div>
                  </div>
                  <div>
                    {priceValue != null ? (
                      <span>${Number(priceValue).toFixed(2)}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div style={{ color: pctColor }}>
                    {typeof pct === "number"
                      ? `${pctPrefix}${pct.toFixed(2)}%`
                      : "—"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{trendEmoji}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        opacity: 0.7,
                      }}
                    >
                      spark
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteWatchItem(item)}
                    style={{
                      borderRadius: "999px",
                      border: "none",
                      background: "transparent",
                      color: "#e5e7eb",
                      width: "24px",
                      height: "24px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                    title="Remove from watchlist"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid #111827",
            background: "#020617",
            padding: "10px 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "140px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#e5e7eb",
              }}
            >
              Notifications
            </div>
            <div
              style={{
                width: 10,
                height: 18,
                borderRadius: 999,
                background: "#0ea5e9",
              }}
              title="Live feed"
            />
          </div>

          <div
            style={{
              fontSize: "12px",
              flex: 1,
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {notifications.length === 0 && (
              <div style={{ opacity: 0.6 }}>
                🧠 Live AI alerts, executions, and Discord messages will
                appear here.
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  marginBottom: "4px",
                  padding: "4px 0",
                  borderBottom: "1px dashed #111827",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <span>🧠</span>
                <span>{n.message}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Floating AI Coach */}
      <AIChatWidget symbol={symbol} />
    </div>

      {showDailyBrief && (
        <div
          onClick={() => setShowDailyBrief(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 860,
              maxWidth: "95vw",
              background: "rgba(2,6,23,0.96)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 18,
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>🗞 Daily Brief</div>
              <button
                onClick={() => setShowDailyBrief(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(15,23,42,0.55)",
                  color: "#e5e7eb",
                  fontWeight: 800,
                }}
              >
                Close
              </button>
            </div>
            <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 12 }}>
              {dailyBriefLoading ? "Loading…" : dailyBrief?.generated_at ? `Generated: ${dailyBrief.generated_at}` : ""}
            </div>
            <div style={{ marginTop: 12, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {dailyBriefLoading
                ? "Loading daily brief…"
                : dailyBrief?.content || dailyBrief?.text || dailyBrief?.summary || "No brief yet."}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Dashboard;