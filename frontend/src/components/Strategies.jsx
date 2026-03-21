import React, { useEffect, useMemo, useState } from "react";

/**
 * Strategies (Custom Rules) - non-invasive overlay
 * - Stored in localStorage
 * - Does NOT block built-in engine; it only provides extra context.
 */
const LS_KEY = "woi_custom_strategies_v1";

const defaultNew = {
  name: "",
  rules: "",
  timeframe: "Any",
  aggressiveness: "Conservative",
  active: true,
};

function loadStrategies() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStrategies(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export default function Strategies() {
  const [items, setItems] = useState(() => loadStrategies());
  const [draft, setDraft] = useState(defaultNew);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    saveStrategies(items);
  }, [items]);

  const activeCount = useMemo(() => items.filter((s) => s.active).length, [items]);

  const addStrategy = () => {
    if (!draft.name.trim() || !draft.rules.trim()) return;
    const s = {
      id: `cs_${Date.now()}`,
      ...draft,
      name: draft.name.trim(),
      rules: draft.rules.trim(),
    };
    setItems((prev) => [s, ...prev]);
    setDraft(defaultNew);
  };

  const removeStrategy = (id) => setItems((prev) => prev.filter((s) => s.id !== id));

  const toggleActive = (id) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));

  const update = (id, patch) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const selected = items.find((s) => s.id === selectedId) || null;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Strategies</h2>
        <div style={{ opacity: 0.8, fontSize: 12 }}>
          Active: <b>{activeCount}</b> / {items.length}
        </div>
      </div>

      <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12, lineHeight: 1.4 }}>
        Add custom trading rules without touching the built-in engine. These are treated as{" "}
        <b>advisory overlays</b> (extra preferences/constraints) when the UI requests AI insight.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 14,
          marginTop: 16,
        }}
      >
        {/* Create */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 12,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Create Strategy</div>

          <label style={{ fontSize: 12, opacity: 0.8 }}>Name</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g., 'Breakout + pullback'"
            style={inputStyle}
          />

          <label style={{ fontSize: 12, opacity: 0.8, marginTop: 10, display: "block" }}>
            Rules / Notes
          </label>
          <textarea
            value={draft.rules}
            onChange={(e) => setDraft((p) => ({ ...p, rules: e.target.value }))}
            placeholder="Write your trading rules… (the built-in engine still runs)"
            style={{ ...inputStyle, height: 110, resize: "vertical" }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Timeframe</label>
              <select
                value={draft.timeframe}
                onChange={(e) => setDraft((p) => ({ ...p, timeframe: e.target.value }))}
                style={inputStyle}
              >
                {["Any", "1m", "5m", "15m", "1h", "4h", "1D", "1W"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Aggressiveness</label>
              <select
                value={draft.aggressiveness}
                onChange={(e) => setDraft((p) => ({ ...p, aggressiveness: e.target.value }))}
                style={inputStyle}
              >
                {["Conservative", "Aggressive", "Very Aggressive"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={addStrategy} style={btnPrimary}>
              Add
            </button>
            <button
              onClick={() => {
                setDraft(defaultNew);
              }}
              style={btnGhost}
            >
              Reset
            </button>
          </div>
        </div>

        {/* List + Editor */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 12,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>Active Strategies</div>
            <button onClick={() => setItems([])} style={btnDanger}>
              Clear All
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, marginTop: 10 }}>
            <div style={{ maxHeight: 420, overflow: "auto", paddingRight: 6 }}>
              {items.length === 0 ? (
                <div style={{ opacity: 0.75, fontSize: 12, padding: 10 }}>
                  No strategies yet. Create one on the left.
                </div>
              ) : (
                items.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 8,
                      cursor: "pointer",
                      background:
                        selectedId === s.id ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <label style={{ fontSize: 12, opacity: 0.9 }}>
                        <input
                          type="checkbox"
                          checked={!!s.active}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleActive(s.id);
                          }}
                        />{" "}
                        active
                      </label>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      {s.timeframe} • {s.aggressiveness}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              {!selected ? (
                <div style={{ opacity: 0.75, fontSize: 12, padding: 10 }}>
                  Select a strategy to edit it.
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>{selected.name}</div>
                    <button onClick={() => removeStrategy(selected.id)} style={btnDanger}>
                      Delete
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, opacity: 0.8 }}>Timeframe</label>
                      <select
                        value={selected.timeframe}
                        onChange={(e) => update(selected.id, { timeframe: e.target.value })}
                        style={inputStyle}
                      >
                        {["Any", "1m", "5m", "15m", "1h", "4h", "1D", "1W"].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, opacity: 0.8 }}>Aggressiveness</label>
                      <select
                        value={selected.aggressiveness}
                        onChange={(e) => update(selected.id, { aggressiveness: e.target.value })}
                        style={inputStyle}
                      >
                        {["Conservative", "Aggressive", "Very Aggressive"].map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label style={{ fontSize: 12, opacity: 0.8, marginTop: 10, display: "block" }}>
                    Rules / Notes
                  </label>
                  <textarea
                    value={selected.rules}
                    onChange={(e) => update(selected.id, { rules: e.target.value })}
                    style={{ ...inputStyle, height: 220, resize: "vertical" }}
                  />

                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                    Tip: your strategy will be included with AI Insight requests as an extra overlay
                    (it won’t block the built-in logic).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 6,
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
};

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,255,255,0.25)",
  background: "rgba(0,255,255,0.12)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const btnDanger = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,0,80,0.25)",
  background: "rgba(255,0,80,0.12)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
