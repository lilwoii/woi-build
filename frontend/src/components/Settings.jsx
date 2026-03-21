// frontend/src/components/Settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";
import { useAIMode } from "../context/AIModeContext";

const SETTINGS_LOCAL_THEME_KEY = "woi_theme_v1";

const THEME_PRESETS = [
  {
    id: "neo_dark",
    name: "Neo Dark",
    emoji: "🛰️",
    accent: "#6366f1",
    bg: "radial-gradient(circle at top, #020617, #020617 50%, #020617)",
  },
  {
    id: "cyber_grid",
    name: "Cyber Grid",
    emoji: "🕸️",
    accent: "#22c55e",
    bg: "radial-gradient(circle at top, #020617, #020617 40%, #020617)",
  },
  {
    id: "terminal",
    name: "Terminal",
    emoji: "🧮",
    accent: "#22c55e",
    bg: "linear-gradient(135deg, #020617, #020617)",
  },
  {
    id: "sunset",
    name: "Sunset Fade",
    emoji: "🌅",
    accent: "#f97316",
    bg: "linear-gradient(135deg, #020617, #1e293b)",
  },
];

function applyThemeToDocument(theme) {
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty("--woi-accent", theme.accent || "#6366f1");
  root.style.setProperty("--woi-bg", theme.bg || "#020617");
  document.body.style.backgroundImage = theme.bg || "";
  document.body.style.backgroundColor = "#020617";
}

const Settings = () => {
  const { aiMode, setAiMode } = useAIMode();

  const [activeTab, setActiveTab] = useState("general"); // general | risk | theme
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [discordTestStatus, setDiscordTestStatus] = useState("");

  // core backend settings
  const [settings, setSettings] = useState({
    discord_webhook: "",
    use_paper: true,
    use_crypto: false,
    signal_schedule_min: 0,
    risk_sl_pct: 1.5,
    risk_tp_pct: 3.0,
    risk_per_trade_pct: 1.0,
    size_mode: "risk_pct",
    horizon_min_days: 5,
    horizon_max_days: 30,
    allow_long_horizon: true,
  });

  // scanner settings (controls background analyzers + auto-train on ingest)
  const [scannerSettings, setScannerSettings] = useState(null);
  const [autoTrainOnIngest, setAutoTrainOnIngest] = useState(true);


  // theme
  const [themePresetId, setThemePresetId] = useState("neo_dark");
  const [themeAccent, setThemeAccent] = useState("#6366f1");
  const [themeDirty, setThemeDirty] = useState(false);

  const currentPreset = useMemo(
    () => THEME_PRESETS.find((p) => p.id === themePresetId) || THEME_PRESETS[0],
    [themePresetId]
  );

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // -------------------------
  // Discord: test notification
  // -------------------------
  const testDiscord = async () => {
    setDiscordTestStatus("⏳ Sending test...");
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/discord/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "✅ Woi's Assistant: Discord test OK" }),
      });
      if (res.ok) {
        setDiscordTestStatus("✅ Sent! Check Discord.");
      } else {
        let msg = "❌ Failed";
        try {
          const data = await res.json();
          msg = data?.error || data?.detail || msg;
        } catch {}
        setDiscordTestStatus("❌ Failed to send");
        setError(msg);
      }
    } catch (e) {
      setDiscordTestStatus("❌ Error");
      setError(String(e));
    }
  };

  // --------- load settings + theme ----------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          setError("Failed to load settings from backend.");
        } else {
          setSettings((prev) => ({ ...prev, ...data }));
          // also load scanner settings (auto-train toggle, anomaly thresholds, etc)
          try {
            const sres = await fetch(`${API_BASE_URL}/scanner/settings`);
            const sdata = await sres.json().catch(() => null);
            if (sres.ok && sdata) {
              setScannerSettings(sdata);
              if (typeof sdata.auto_train_on_ingest === "boolean") {
                setAutoTrainOnIngest(sdata.auto_train_on_ingest);
              }
            }
          } catch (e) {
            // optional
          }
        }
      } catch (err) {
        console.error("Settings load error", err);
        setError("Failed to load settings (network/backend).");
      } finally {
        setLoading(false);
      }

      // theme from localStorage
      try {
        const raw = localStorage.getItem(SETTINGS_LOCAL_THEME_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setThemePresetId(parsed.presetId || "neo_dark");
          setThemeAccent(parsed.accent || "#6366f1");
          applyThemeToDocument(parsed);
        } else {
          applyThemeToDocument(THEME_PRESETS[0]);
        }
      } catch {
        applyThemeToDocument(THEME_PRESETS[0]);
      }
    };

    load();
  }, []);

  // --------- backend save ----------
  const handleSaveBackendSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        discord_webhook: settings.discord_webhook || null,
        use_paper: !!settings.use_paper,
        use_crypto: !!settings.use_crypto,
        signal_schedule_min: Number(settings.signal_schedule_min) || 0,
        risk_sl_pct: Number(settings.risk_sl_pct) || 1.5,
        risk_tp_pct: Number(settings.risk_tp_pct) || 3.0,
        risk_per_trade_pct: Number(settings.risk_per_trade_pct) || 1.0,
        size_mode: settings.size_mode || "risk_pct",
        horizon_min_days: Number(settings.horizon_min_days) || 5,
        horizon_max_days: Number(settings.horizon_max_days) || 30,
        allow_long_horizon: !!settings.allow_long_horizon,
      };

      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError("Failed to save settings – backend rejected the payload.");
      } else {
        setSettings((prev) => ({ ...prev, ...data }));
          // save scanner settings (includes auto-train-on-ingest toggle)
          if (scannerSettings) {
            try {
              const payload = {
                ...scannerSettings,
                auto_train_on_ingest: autoTrainOnIngest,
              };
              await fetch(`${API_BASE_URL}/scanner/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
            } catch (e) {
              // optional
            }
          }
      }
    } catch (err) {
      console.error("Settings save error", err);
      setError("Failed to save settings (network/backend).");
    } finally {
      setSaving(false);
    }
  };

  // --------- theme controls ----------
  const handleSelectPreset = (presetId) => {
    setThemePresetId(presetId);
    const preset = THEME_PRESETS.find((p) => p.id === presetId) || THEME_PRESETS[0];
    setThemeAccent(preset.accent);
    setThemeDirty(true);
    applyThemeToDocument(preset);
  };

  const handleAccentChange = (hex) => {
    setThemeAccent(hex);
    setThemeDirty(true);
    applyThemeToDocument({ ...currentPreset, accent: hex, presetId: currentPreset.id });
  };

  const saveThemeLocal = () => {
    const payload = { presetId: themePresetId, accent: themeAccent, bg: currentPreset.bg };
    localStorage.setItem(SETTINGS_LOCAL_THEME_KEY, JSON.stringify(payload));
    setThemeDirty(false);
    applyThemeToDocument(payload);
  };

  // --------- UI helpers ----------
  const tabButtonStyle = (id) => ({
    borderRadius: "999px",
    border: activeTab === id ? "1px solid #38bdf8" : "1px solid #111827",
    background: "#020617",
    color: "#e5e7eb",
    padding: "8px 12px",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: activeTab === id ? "0 0 0 1px rgba(56, 189, 248, 0.45)" : "none",
  });

  const cardStyle = {
    borderRadius: "16px",
    border: "1px solid #111827",
    background: "radial-gradient(circle at top, #020617, #020617 40%, #020617)",
    padding: "12px 14px",
  };

  const labelStyle = {
    fontSize: "12px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  };

  // --------- render tabs ----------
  const renderAIModeCard = () => (
    <div style={{ ...cardStyle }}>
      <div style={labelStyle}>Active AI</div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 240 }}>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>Choose which AI is active</div>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: 4 }}>
            ⚡ Fast is default. 🧠 Deep is your trained AI. 👑 Master is the shared project coach AI.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "fast", label: "⚡ Fast" },
            { id: "deep", label: "🧠 Deep" },
            { id: "master", label: "👑 Master" },
          ].map((m) => {
            const active = aiMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setAiMode(m.id)}
                style={{
                  borderRadius: "999px",
                  border: active ? "1px solid #38bdf8" : "1px solid #111827",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "8px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  boxShadow: active ? "0 0 0 1px rgba(56, 189, 248, 0.45)" : "none",
                  fontWeight: active ? 700 : 500,
                }}
                title={
                  m.id === "fast"
                    ? "Instant signals + quick reasoning (default)"
                    : m.id === "deep"
                    ? "Your custom trained model (strict, personal)"
                    : "Shared master coach AI (platform-wide learning)"
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: "12px", color: "#cbd5e1", lineHeight: 1.35 }}>
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: "#e5e7eb", fontWeight: 700 }}>⚡ Fast AI:</span> default engine for everyone.
        </div>
        <div style={{ marginBottom: 6 }}>
          <span style={{ color: "#e5e7eb", fontWeight: 700 }}>🧠 Deep AI:</span> train it your way (strict rules, personal behavior).
        </div>
        <div>
          <span style={{ color: "#e5e7eb", fontWeight: 700 }}>👑 Master AI:</span> the “Project brain” that learns generalized behavior (coach + safety rails).
        </div>
      </div>
    </div>
  );

  const renderChromeExtensionCard = () => (
    <div style={{ ...cardStyle }}>
      <div style={labelStyle}>Chrome Extension</div>
      <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: 6 }}>
        🧩 Browser helper + “Send to AI”
      </div>
      <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.35 }}>
        Capture web context (news, filings, screenshots, text) and send it into Woi’s Assistant for analysis, watchlist updates, and optional micro-training.
      </div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          "Highlight / Right‑click → “Send to AI”",
          "Send page link + selected text",
          "Extract tickers → add to watchlist",
          "Optional: capture screenshot → AI Insight",
        ].map((t) => (
          <span
            key={t}
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: "12px",
              color: "#e5e7eb",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: "12px", color: "#cbd5e1" }}>
        When you’re ready, we can add a dedicated <b>Extension</b> tab that generates the full extension folder + manifest + scripts for “Send to AI”.
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {renderAIModeCard()}

      <div style={{ ...cardStyle }}>
        <div style={labelStyle}>General</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: 6 }}>
              Discord Webhook (used for alerts + snapshots)
            </div>
            <input
              value={settings.discord_webhook || ""}
              onChange={(e) => updateSetting("discord_webhook", e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "10px 12px",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={testDiscord}
                style={{
                  borderRadius: 999,
                  border: "1px solid #38bdf8",
                  background: "#020617",
                  color: "#e5e7eb",
                  padding: "8px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                title="Send a test message to your Discord webhook."
              >
                🔔 Test Discord
              </button>
            </div>

          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: "10px",
              border: "1px solid #1f2937",
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!settings.use_paper}
              onChange={(e) => updateSetting("use_paper", e.target.checked)}
            />
            <span style={{ fontSize: "12px" }}>Default to PAPER trading (safer)</span>
          </label>

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #111827' }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
                Behavior data (Chrome extension + coach) can automatically trigger a small training job so the system improves continuously.
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <input
                  type='checkbox'
                  checked={autoTrainOnIngest}
                  onChange={(e) => setAutoTrainOnIngest(e.target.checked)}
                />
                <span>Auto-train after each “Send to AI” (recommended)</span>
              </label>
            </div>


          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: "10px",
              border: "1px solid #1f2937",
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!settings.use_crypto}
              onChange={(e) => updateSetting("use_crypto", e.target.checked)}
            />
            <span style={{ fontSize: "12px" }}>Enable Crypto mode (when available)</span>
          </label>
        </div>
      </div>

      {renderChromeExtensionCard()}
    </div>
  );

  const renderRiskTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "12px" }}>
      <div style={{ ...cardStyle }}>
        <div style={labelStyle}>Risk</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Risk per trade %</div>
            <input
              type="number"
              step="0.1"
              value={settings.risk_per_trade_pct}
              onChange={(e) => updateSetting("risk_per_trade_pct", e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 10px",
              }}
            />
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Size mode</div>
            <select
              value={settings.size_mode || "risk_pct"}
              onChange={(e) => updateSetting("size_mode", e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 10px",
              }}
            >
              <option value="risk_pct">risk_pct</option>
              <option value="fixed_qty">fixed_qty</option>
            </select>
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Stop loss %</div>
            <input
              type="number"
              step="0.1"
              value={settings.risk_sl_pct}
              onChange={(e) => updateSetting("risk_sl_pct", e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 10px",
              }}
            />
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Take profit %</div>
            <input
              type="number"
              step="0.1"
              value={settings.risk_tp_pct}
              onChange={(e) => updateSetting("risk_tp_pct", e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 10px",
              }}
            />
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Horizon min days</div>
            <input
              type="number"
              min="1"
              value={settings.horizon_min_days}
              onChange={(e) => updateSetting("horizon_min_days", e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 10px",
              }}
            />
          </div>

          <div>
            <div style={{ color: "#9ca3af", marginBottom: 6 }}>Horizon max days</div>
            <input
              type="number"
              min="1"
              value={settings.horizon_max_days}
              onChange={(e) => updateSetting("horizon_max_days", e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #1f2933",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 10px",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: "10px",
              border: "1px solid #1f2937",
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!settings.allow_long_horizon}
              onChange={(e) => updateSetting("allow_long_horizon", e.target.checked)}
            />
            <span>Allow long horizon (&gt; 30 trading days)</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderThemeTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "12px" }}>
      <div style={{ ...cardStyle }}>
        <div style={labelStyle}>Theme</div>

        <div style={{ color: "#9ca3af", marginBottom: 10 }}>
          Choose a preset + accent. This saves locally (doesn’t break backend).
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {THEME_PRESETS.map((p) => {
            const active = themePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                style={{
                  textAlign: "left",
                  borderRadius: "12px",
                  border: active ? "1px solid #38bdf8" : "1px solid #1f2937",
                  background: "#020617",
                  padding: "10px 10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  boxShadow: active ? "0 0 0 1px rgba(56, 189, 248, 0.45)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{p.emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#e5e7eb" }}>
                    {p.name}
                  </span>
                </div>
                <div
                  style={{
                    height: "22px",
                    borderRadius: "999px",
                    border: "1px solid #111827",
                    backgroundImage: p.bg,
                  }}
                />
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ color: "#9ca3af" }}>Accent</div>
          <input
            type="color"
            value={themeAccent}
            onChange={(e) => handleAccentChange(e.target.value)}
            style={{ width: 48, height: 28, border: "none", background: "transparent", cursor: "pointer" }}
            title="Pick accent color"
          />
          <div style={{ color: "#cbd5e1" }}>{themeAccent}</div>

          <button
            onClick={saveThemeLocal}
            disabled={!themeDirty}
            style={{
              marginLeft: "auto",
              borderRadius: "999px",
              border: "none",
              background: themeDirty ? "linear-gradient(135deg, #22c55e, #0ea5e9, #6366f1)" : "#111827",
              color: themeDirty ? "#0b1120" : "#94a3b8",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: themeDirty ? "pointer" : "not-allowed",
              opacity: themeDirty ? 1 : 0.7,
            }}
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 16, color: "#e5e7eb", background: "#020617", minHeight: "100%" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>⚙️ Settings</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          {loading ? "Loading…" : "Ready"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={tabButtonStyle("general")} onClick={() => setActiveTab("general")}>
          ⚙️ General
        </button>
        <button style={tabButtonStyle("risk")} onClick={() => setActiveTab("risk")}>
          🛡️ Risk
        </button>
        <button style={tabButtonStyle("theme")} onClick={() => setActiveTab("theme")}>
          🎨 Theme
        </button>
      </div>

      <div style={{ borderRadius: 16, border: "1px solid #111827", background: "#020617", padding: 12 }}>
        {activeTab === "general" && renderGeneralTab()}
        {activeTab === "risk" && renderRiskTab()}
        {activeTab === "theme" && renderThemeTab()}
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#111827",
            color: "#fecaca",
            fontSize: 12,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Save button (not on Theme tab, since theme saves locally) */}
      {activeTab !== "theme" && (
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSaveBackendSettings}
            disabled={saving}
            style={{
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #0ea5e9, #6366f1)",
              color: "#0b1120",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;