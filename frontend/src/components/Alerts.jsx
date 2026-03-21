// frontend/src/components/Alerts.jsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [alerts, setAlerts] = useState([]);

  // form state
  const [symbol, setSymbol] = useState("TSLA");
  const [price, setPrice] = useState("");
  const [direction, setDirection] = useState("above"); // above / below
  const [note, setNote] = useState("");

  // fetch current symbol (from dashboard global)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) get current symbol
        try {
          const resSym = await fetch(`${API_BASE_URL}/symbol`);
          if (resSym.ok) {
            const data = await resSym.json();
            if (data?.symbol) {
              setSymbol(String(data.symbol).toUpperCase());
            }
          }
        } catch (e) {
          console.warn("Failed to load current symbol:", e);
        }

        // 2) get alerts
        await reloadAlerts();
      } catch (err) {
        console.error("Init alerts error", err);
        setError("Failed to load alerts from backend.");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadAlerts = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) {
        setError("Failed to load alerts from backend.");
        return;
      }
      setAlerts(
        data.sort((a, b) => {
          // sort by symbol then price
          const sa = (a.symbol || "").localeCompare(b.symbol || "");
          if (sa !== 0) return sa;
          return Number(a.price || 0) - Number(b.price || 0);
        })
      );
    } catch (err) {
      console.error("Reload alerts error", err);
      setError("Failed to load alerts (network/backend).");
    }
  };

  const resetForm = () => {
    setPrice("");
    setNote("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;

    const cleanSymbol = symbol.trim().toUpperCase();
    const p = parseFloat(price);
    if (!cleanSymbol || !Number.isFinite(p)) {
      setError("Symbol and price are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body = {
        symbol: cleanSymbol,
        direction,
        price: p,
        note: note || null,
      };

      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        setError(
          data?.detail ||
            data?.error ||
            "Failed to create alert – backend rejected the payload."
        );
      } else {
        resetForm();
        await reloadAlerts();
      }
    } catch (err) {
      console.error("Create alert error", err);
      setError("Failed to create alert (network/backend).");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (alertId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/alerts/${encodeURIComponent(alertId)}/toggle`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        console.warn("Toggle alert failed", data);
        return;
      }
      // update locally without full reload if possible
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? data : a))
      );
    } catch (err) {
      console.error("Toggle alert error", err);
    }
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm("Delete this alert rule?")) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/alerts/${encodeURIComponent(alertId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (err) {
      console.error("Delete alert error", err);
    }
  };

  const statusChip = (enabled) => {
    if (enabled) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: "11px",
            color: "#bbf7d0",
          }}
        >
          ✅ Active
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: "11px",
          color: "#facc15",
        }}
      >
        ⏸️ Paused
      </span>
    );
  };

  const directionChip = (dir) => {
    const d = (dir || "").toLowerCase();
    if (d === "above") {
      return (
        <span
          style={{
            fontSize: "11px",
            color: "#22c55e",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          📈 Above
        </span>
      );
    }
    if (d === "below") {
      return (
        <span
          style={{
            fontSize: "11px",
            color: "#ef4444",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          📉 Below
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: "11px",
          color: "#9ca3af",
        }}
      >
        —
      </span>
    );
  };

  const toggleButtonStyle = (enabled) => ({
    borderRadius: "999px",
    border: "1px solid #1f2937",
    padding: "4px 10px",
    fontSize: "11px",
    cursor: "pointer",
    background: enabled
      ? "linear-gradient(135deg, #22c55e, #16a34a)"
      : "#020617",
    color: enabled ? "#0b1120" : "#e5e7eb",
    boxShadow: enabled
      ? "0 0 10px rgba(34,197,94,0.6)"
      : "0 0 4px rgba(15,23,42,0.9)",
    transition: "box-shadow 0.15s ease, transform 0.15s ease",
  });

  const deleteButtonStyle = {
    borderRadius: "999px",
    border: "1px solid #1f2937",
    padding: "4px 7px",
    fontSize: "12px",
    cursor: "pointer",
    background: "#111827",
    color: "#e5e7eb",
  };

  // --------- render ----------

  return (
    <div
      style={{
        padding: "16px",
        background: "#020617",
        color: "#e5e7eb",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#94a3b8",
            }}
          >
            Alerts
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            Per-symbol price rules that fire straight into Discord. ⏰📈
          </div>
        </div>
        <div
          style={{
            borderRadius: "999px",
            border: "1px solid #1f2937",
            padding: "6px 12px",
            fontSize: "11px",
            color: "#9ca3af",
          }}
        >
          {loading ? "Loading…" : `${alerts.length} rule(s)`}
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid #111827",
          background:
            "radial-gradient(circle at top, #020617, #020617 40%, #020617)",
          padding: "12px 14px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
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
              New alert rule
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              The scheduler checks these alongside your watchlist and AI
              signals.
            </div>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
            }}
          >
            Fires once, then auto-pauses. 🎯
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr 1.4fr auto",
            gap: "8px",
            alignItems: "center",
            fontSize: "12px",
          }}
        >
          <input
            value={symbol}
            onChange={(e) =>
              setSymbol(e.target.value.toUpperCase())
            }
            placeholder="Symbol (TSLA, AAPL, BTCUSD…) "
            style={{
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              padding: "6px 10px",
              outline: "none",
            }}
          />

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Target price"
            step="0.01"
            style={{
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              padding: "6px 10px",
              outline: "none",
            }}
          />

          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            style={{
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              padding: "6px 10px",
            }}
          >
            <option value="above">📈 Price crosses ABOVE</option>
            <option value="below">📉 Price crosses BELOW</option>
          </select>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (breakout of range…)"
            style={{
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              padding: "6px 10px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              borderRadius: "999px",
              border: "none",
              background:
                "linear-gradient(135deg, #22c55e, #0ea5e9, #6366f1)",
              color: "#0b1120",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow:
                "0 0 12px rgba(99,102,241,0.7)",
              opacity: saving ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {saving ? "Adding…" : "Add alert"}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: "10px",
            padding: "8px 10px",
            borderRadius: "8px",
            background: "#111827",
            color: "#fecaca",
            fontSize: "12px",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Alert list */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid #111827",
          background: "#020617",
          padding: "10px 12px",
          minHeight: "120px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#94a3b8",
            marginBottom: "6px",
          }}
        >
          Existing rules
        </div>

        {alerts.length === 0 && !loading && (
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            No alerts yet. Add a rule above – the scheduler will watch
            for it and ping Discord when it hits. 🚨
          </div>
        )}

        {alerts.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
              marginTop: "2px",
            }}
          >
            {alerts.map((a) => {
              const enabled = !!a.enabled;
              const sym = (a.symbol || "").toUpperCase();
              const p = Number(a.price || 0);

              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    borderRadius: "10px",
                    border: "1px solid #111827",
                    padding: "6px 8px",
                    background:
                      "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.95))",
                  }}
                >
                  {/* Left: symbol + price + direction */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {sym}
                      </span>
                      {directionChip(a.direction)}
                      {statusChip(enabled)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      Target:{" "}
                      <span
                        style={{
                          color:
                            a.direction === "above"
                              ? "#22c55e"
                              : a.direction === "below"
                              ? "#ef4444"
                              : "#e5e7eb",
                        }}
                      >
                        {a.direction === "above" ? "≥" : "≤"}{" "}
                        {p.toFixed(2)}
                      </span>
                      {a.note && (
                        <>
                          {" "}
                          ·{" "}
                          <span
                            style={{
                              color: "#cbd5f5",
                            }}
                          >
                            {a.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={() => handleToggle(a.id)}
                      style={toggleButtonStyle(enabled)}
                    >
                      {enabled ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={deleteButtonStyle}
                      title="Delete alert"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
