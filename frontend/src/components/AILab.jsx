// frontend/src/components/AILab.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { API_BASE_URL } from "../config";

const AILab = () => {
  // -------------------------
  // One-shot training inputs
  // -------------------------
  const [symbolsInput, setSymbolsInput] = useState("TSLA, NVDA, SPY");
  const [epochs, setEpochs] = useState(5);
  const [timeframe, setTimeframe] = useState("1D");
  const [modelSize, setModelSize] = useState("light"); // "light" | "heavy"
  const [computeTier, setComputeTier] = useState("local"); // "local" | "runpod_24" | "runpod_80"

  // Optional: separate Discord webhook for training chatter (so it doesn't flood the main webhook)
  const [trainingDiscordWebhook, setTrainingDiscordWebhook] = useState(() => {
    try {
      return localStorage.getItem("woi_training_discord_webhook") || "";
    } catch {
      return "";
    }
  });

  // Endless knobs
  const [epochsPerCycle, setEpochsPerCycle] = useState(3);
  const [cooldownSec, setCooldownSec] = useState(2);

  useEffect(() => {
    try { localStorage.setItem("woi_training_discord_webhook", trainingDiscordWebhook || ""); } catch {}
  }, [trainingDiscordWebhook]);


  // One-shot training UI
  const [isTraining, setIsTraining] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastResponse, setLastResponse] = useState(null);
  const [lastError, setLastError] = useState(null);

  // Endless training job UI
  const [activeJobId, setActiveJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [jobError, setJobError] = useState(null);
  const pollTimerRef = useRef(null);

  // Training history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // -------------------------
  // Universe Scanner (A–C blocks)
  // -------------------------
  const [scanJobId, setScanJobId] = useState(null);
  const [scanJob, setScanJob] = useState(null);
  const [scanPolling, setScanPolling] = useState(false);
  const [scanError, setScanError] = useState(null);

  const parseSymbols = () =>
    symbolsInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

  const formatDateTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  // -------------------------
  // Training history fetch
  // -------------------------
  const fetchTrainingHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/training/history`);
      const data = await res.json();

      // backend returns { rows: [...], count: N } OR [...]
      const rows = Array.isArray(data) ? data : (data?.rows || data?.history || []);
      setHistory(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Failed to load training history", e);
      setHistory([]);
    }
  };

  // ✅ FIX: the function your code calls everywhere
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      await fetchTrainingHistory();
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ Load history when AI Lab opens
  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Endless training polling
  // -------------------------
  const fetchJob = async (jobId) => {
    if (!jobId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ai/train/job/${jobId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch job");
      setJob(data);
      setJobError(null);
    } catch (e) {
      setJobError(e.message);
    }
  };

  useEffect(() => {
    // cleanup old timer
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!activeJobId) {
      setJob(null);
      setJobError(null);
      return;
    }

    // initial fetch
    fetchJob(activeJobId);

    // poll every 2s
    pollTimerRef.current = setInterval(() => {
      fetchJob(activeJobId);
    }, 2000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [activeJobId]);

  // -------------------------
  // One-shot training
  // -------------------------
  const handleStartTraining = async () => {
    const symbols = parseSymbols();
    if (!symbols.length) {
      setStatusMessage("Please enter at least one symbol.");
      return;
    }
    if (!epochs || Number(epochs) <= 0) {
      setStatusMessage("Epochs must be at least 1.");
      return;
    }

    setIsTraining(true);
    setLastError(null);
    setStatusMessage("Starting training job...");
    setLastResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        discord_webhook: trainingDiscordWebhook || null,
          symbols,
          epochs: Number(epochs),
          timeframe,
          model_size: modelSize,
          compute_tier: computeTier,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Training request failed");

      setLastResponse(data);

      if (data.status === "submitted") {
        setStatusMessage(
          `Training submitted to ${
            data.mode === "runpod_80"
              ? "RunPod 80GB"
              : data.mode === "runpod_24"
              ? "RunPod 24GB"
              : "remote endpoint"
          } (job: ${data.job_id || "n/a"}).`
        );
      } else if (data.status === "completed") {
        setStatusMessage(`Local training completed (job: ${data.job_id || "n/a"}).`);
      } else {
        setStatusMessage("Training request completed.");
      }

      await fetchHistory();
    } catch (err) {
      console.error(err);
      setLastError(err.message);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  // -------------------------
  // Endless training controls
  // -------------------------
  const handleStartEndless = async () => {
    const symbols = parseSymbols();
    if (!symbols.length) {
      setStatusMessage("Please enter at least one symbol.");
      return;
    }
    if (!epochsPerCycle || Number(epochsPerCycle) <= 0) {
      setStatusMessage("Epochs per cycle must be at least 1.");
      return;
    }

    setStatusMessage("Starting endless training...");
    setJobError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/train/endless/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        discord_webhook: trainingDiscordWebhook || null,
          symbols,
          timeframe,
          model_size: modelSize,
          compute_tier: computeTier,
          epochs_per_cycle: Number(epochsPerCycle),
          cooldown_sec: Number(cooldownSec),
          send_to_discord: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start endless training");

      setActiveJobId(data.job_id);
      setStatusMessage(`Endless training started (job: ${data.job_id}).`);
      await fetchHistory();
    } catch (e) {
      setStatusMessage(`Error: ${e.message}`);
      setJobError(e.message);
    }
  };

  const handleStopEndless = async () => {
    if (!activeJobId) return;

    setStatusMessage("Stopping endless training...");
    try {
      const res = await fetch(`${API_BASE_URL}/ai/train/endless/stop/${activeJobId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to stop job");

      setStatusMessage(`Endless training stopped (job: ${activeJobId}).`);
      await fetchJob(activeJobId);
      await fetchHistory();
    } catch (e) {
      setStatusMessage(`Error: ${e.message}`);
      setJobError(e.message);
    }
  };

  // -------------------------
  // Universe Scanner (A–C blocks)
  // -------------------------
  const pollScanner = async () => {
    if (!scanJobId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/scanner/job/${scanJobId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch scanner job");
      setScanJob(data);
      setScanError(null);
    } catch (e) {
      setScanError(e.message);
    }
  };

  useEffect(() => {
    if (!scanPolling || !scanJobId) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await pollScanner();
    };

    tick();
    const t = setInterval(tick, 2000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [scanPolling, scanJobId]);

  useEffect(() => {
    if (scanJob?.status === "stopped" && scanPolling) {
      setScanPolling(false);
    }
  }, [scanJob?.status, scanPolling]);

  const startScanner = async () => {
    setScanError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/scanner/endless/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_stocks: true,
          scan_crypto: true,
          timeframes: ["15m", "1h", "4h", "1d"],
          top_n: 10,
          interval_sec: 300,
          send_to_discord: true,
          auto_add_top: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start scanner");

      setScanJobId(data.job_id);
      setScanPolling(true);
      setStatusMessage(`Universe scanner started (job: ${data.job_id}).`);
      setScanJob(null);
      pollScanner();
    } catch (e) {
      setScanError(e.message);
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  const stopScanner = async () => {
    if (!scanJobId) return;
    setScanError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/scanner/endless/stop/${scanJobId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to stop scanner");

      setScanPolling(false);
      setStatusMessage(`Universe scanner stopped (job: ${scanJobId}).`);
      pollScanner();
    } catch (e) {
      setScanError(e.message);
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  const scannerRunning = useMemo(() => {
    return ["queued", "scanning"].includes(scanJob?.status);
  }, [scanJob?.status]);

  // -------------------------
  // Status pill + cosmetic bar
  // -------------------------
  const statusInfo = useMemo(() => {
    const st = job?.status;

    if (jobError) return { label: "Error", emoji: "🔴", color: "#fca5a5", running: false };
    if (st === "queued") return { label: "Queued", emoji: "🟦", color: "#7dd3fc", running: true };
    if (st === "training") return { label: "Training", emoji: "🟢", color: "#6ee7b7", running: true };
    if (st === "stopping") return { label: "Stopping", emoji: "🟡", color: "#fde68a", running: true };
    if (st === "stopped") return { label: "Stopped", emoji: "🔴", color: "#fca5a5", running: false };
    if (st === "completed") return { label: "Completed", emoji: "✅", color: "#6ee7b7", running: false };
    if (st === "failed") return { label: "Failed", emoji: "❌", color: "#fca5a5", running: false };

    if (lastError) return { label: "Error", emoji: "🔴", color: "#fca5a5", running: false };
    if (isTraining) return { label: "Training", emoji: "🟢", color: "#6ee7b7", running: true };
    if (lastResponse?.status === "submitted") return { label: "Queued", emoji: "🟦", color: "#7dd3fc", running: true };

    return { label: "Idle", emoji: "⚪", color: "rgba(255,255,255,0.55)", running: false };
  }, [job, jobError, lastError, isTraining, lastResponse]);

  // -------------------------
  // Backwards-compatible aliases (older UI markup expects these names)
  // -------------------------
  const trainingHistory = history;
  const jobRunning = isTraining;
  const endlessRunning = Boolean(activeJobId) && ["queued", "training"].includes(job?.status || "queued");

  const startOneShotTraining = handleStartTraining;
  const startEndlessTraining = handleStartEndless;
  const stopEndlessTraining = handleStopEndless;

  // Scanner status used by UI
  const scannerStatus = useMemo(() => {
    if (!scanJobId) return "stopped";
    if (scannerRunning) return "running";
    return scanJob?.status || "stopped";
  }, [scanJobId, scannerRunning, scanJob?.status]);

  // Header widgets
  const statusPill = () => (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.20)",
        fontSize: 12,
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#fff",
      }}
      title="Training engine status"
    >
      <span>{statusInfo.emoji}</span>
      <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
    </div>
  );

  const progressBar = () => {
    const active = statusInfo.running;
    return (
      <div
        style={{
          width: 160,
          height: 10,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
        title={active ? "Active" : "Idle"}
      >
        <div
          style={{
            height: "100%",
            width: active ? "70%" : "15%",
            background: active ? "rgba(79,199,255,0.65)" : "rgba(255,255,255,0.22)",
            transition: "width 280ms ease",
          }}
        />
      </div>
    );
  };


  // -------------------------
  // Professional UI styling
  // -------------------------
  const S = {
    page: {
      minHeight: "100vh",
      padding: 24,
      color: "#fff",
      background: "radial-gradient(circle at 20% 20%, #0b1630, #050915 70%)",
    },
    container: { maxWidth: 1120, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 16 },
    h1: { fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: 0.2 },
    sub: {
      color: "rgba(255,255,255,0.65)",
      fontSize: 13,
      marginTop: 6,
      lineHeight: 1.35,
      maxWidth: 760,
    },
    grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    },
    title: {
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.70)",
      marginBottom: 10,
    },
    row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 },
    hint: { fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 8, lineHeight: 1.35 },
    label: { fontSize: 12, color: "rgba(255,255,255,0.70)", marginBottom: 6, fontWeight: 700 },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(0,0,0,0.25)",
      color: "#fff",
      outline: "none",
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(0,0,0,0.25)",
      color: "#fff",
      outline: "none",
      cursor: "pointer",
    },
    btn: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    btnPrimary: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(79, 199, 255, 0.55)",
      background: "rgba(79, 199, 255, 0.14)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    btnDanger: {
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(248, 113, 113, 0.65)",
      background: "rgba(248, 113, 113, 0.16)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    chip: {
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 12,
      color: "#fff",
      userSelect: "none",
    },
    chipOn: {
      padding: "8px 10px",
      borderRadius: 999,
      border: "1px solid rgba(79, 199, 255, 0.65)",
      background: "rgba(79, 199, 255, 0.16)",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 12,
      color: "#fff",
      userSelect: "none",
    },
    divider: { height: 1, background: "rgba(255,255,255,0.10)", margin: "14px 0" },
    kv: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" },
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.headerRow}>
          <div>
            <h1 style={S.h1}>AI Lab</h1>
            <div style={S.sub}>
              Configure training runs, choose model complexity, and route jobs to local compute or RunPod.
              <br />
              <span style={{ color: "rgba(255,255,255,0.55)" }}>
                This is a training/admin console — polished, readable, and designed for a professional workstation.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {statusPill()}
            {progressBar()}
          </div>
        </div>

        <div style={S.grid2}>
          {/* Model Complexity */}
          <div style={S.card}>
            <div style={S.title}>Model Complexity</div>
            <div style={S.row}>
              <div
                onClick={() => setModelSize("light")}
                style={modelSize === "light" ? S.chipOn : S.chip}
                title="Fast iterations / lower compute"
              >
                ⚡ Light
              </div>
              <div
                onClick={() => setModelSize("heavy")}
                style={modelSize === "heavy" ? S.chipOn : S.chip}
                title="Deeper model / heavier compute"
              >
                🧠 Heavy
              </div>
            </div>
            <div style={S.hint}>Light is quick. Heavy is deeper and better for richer representations.</div>
          </div>

          {/* Compute Tier */}
          <div style={S.card}>
            <div style={S.title}>Compute Tier</div>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={computeTier === "local"}
                  onChange={() => setComputeTier("local")}
                />
                🖥️ Local machine
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={computeTier === "runpod_24"}
                  onChange={() => setComputeTier("runpod_24")}
                />
                ☁️ RunPod — Standard GPU (16–24GB)
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={computeTier === "runpod_80"}
                  onChange={() => setComputeTier("runpod_80")}
                />
                🚀 RunPod — 80GB GPU (heavy jobs)
              </label>
            </div>
            <div style={S.hint}>
              Route one-shot or endless training to local CPU/GPU, or to serverless RunPod tiers.
            </div>
          </div>
        </div>

        <div style={{ height: 14 }} />

        {/* Universe Scanner */}
        <div style={S.card}>
          <div style={S.title}>Universe Scanner</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
              Runs every ~5 minutes and posts top candidates + anomalies to Discord. <b>Does NOT</b> auto-add to watchlist.
            </div>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={startScanner} disabled={scannerStatus === "running"}>
                ▶️ Start
              </button>
              <button style={S.btnDanger} onClick={stopScanner} disabled={scannerStatus !== "running"}>
                ⏹️ Stop
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
            Status: <b>{scannerStatus}</b>
          </div>
        </div>

        <div style={{ height: 14 }} />

        {/* Training Data & Knobs */}
        <div style={S.card}>
          <div style={S.title}>Training Data & Knobs</div>

          <div style={S.kv}>
            <div>
              <div style={S.label}>Symbols list</div>
              <input
                style={S.input}
                value={symbolsInput}
                onChange={(e) => setSymbolsInput(e.target.value)}
                placeholder="TSLA, NVDA, SPY, BTCUSD"
              />
              <div style={S.hint}>Comma-separated tickers. Mixed equities/crypto supported (where providers allow).</div>
            </div>

            <div>
              <div style={S.label}>Timeframe</div>
              <select style={S.select} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="1D">1 day (swing/investing)</option>
                <option value="4H">4 hours (swing)</option>
                <option value="1H">1 hour (active)</option>
                <option value="15m">15 minutes (scalp)</option>
              </select>
              <div style={S.hint}>For investing behavior prefer 1H / 4H / 1D.</div>
            </div>

            <div>
              <div style={S.label}>Epochs (one-shot)</div>
              <input
                style={S.input}
                type="number"
                min={1}
                max={200}
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value || "1", 10))}
              />
              <div style={S.hint}>One-shot trains once and finishes. Endless cycles are below.</div>
            </div>

            <div>
              <div style={S.label}>Endless: epochs per cycle</div>
              <input
                style={S.input}
                type="number"
                min={1}
                max={200}
                value={epochsPerCycle}
                onChange={(e) => setEpochsPerCycle(parseInt(e.target.value || "1", 10))}
              />
              <div style={S.hint}>Endless repeats cycles until you stop.</div>
            </div>

            <div>
              <div style={S.label}>Endless: cooldown (seconds)</div>
              <input
                style={S.input}
                type="number"
                min={0}
                max={600}
                value={cooldownSec}
                onChange={(e) => setCooldownSec(parseInt(e.target.value || "0", 10))}
              />
              <div style={S.hint}>Small pause between cycles (keeps UI responsive).</div>
            </div>

            <div>
              <div style={S.label}>Discord</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                Training job status and scanner hits can post to Discord via your webhook settings.
              </div>
            </div>
          </div>

          <div style={S.divider} />

          <div style={S.footerRow}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
              Active job: <b>{job?.job_id || "—"}</b>
              {job?.job_id ? (
                <span style={{ marginLeft: 10, color: "rgba(255,255,255,0.60)" }}>({job?.status || "unknown"})</span>
              ) : null}
            </div>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={startOneShotTraining} disabled={jobRunning}>
                🧪 Run One‑Shot
              </button>
              <button style={S.btnPrimary} onClick={startEndlessTraining} disabled={endlessRunning}>
                ♾️ Start Endless
              </button>
              <button style={S.btnDanger} onClick={stopEndlessTraining} disabled={!endlessRunning}>
                ⛔ Stop Endless
              </button>
              <button style={S.btn} onClick={fetchTrainingHistory}>
                🧾 Refresh History
              </button>
            </div>
          </div>

          {jobError ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.10)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>⚠️ Job error</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>{jobError}</div>
            </div>
          ) : null}
        </div>

        <div style={{ height: 14 }} />


        {/* Optional training-specific Discord webhook (prevents flooding main webhook) */}
        <div style={S.card}>
          <div style={S.title}>Training Discord (Optional)</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            If set, AI Trainer will post training logs to this webhook instead of the main Discord webhook in Settings.
          </div>
          <div style={{ height: 10 }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={trainingDiscordWebhook}
              onChange={(e) => setTrainingDiscordWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              style={S.input}
            />
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/discord/test_custom`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ webhook: trainingDiscordWebhook }),
                  });
                  const data = await res.json();
                  alert(data?.ok ? "✅ Training webhook ping sent." : "❌ Webhook test failed.");
                } catch {
                  alert("❌ Webhook test failed.");
                }
              }}
              style={S.btn}
              disabled={!trainingDiscordWebhook}
            >
              Test
            </button>
          </div>
        </div>

        <div style={{ height: 14 }} />
        {/* History */}
        <div style={S.card}>
          <div style={S.title}>Training History</div>
          {Array.isArray(trainingHistory) && trainingHistory.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {trainingHistory.slice(0, 12).map((h) => (
                <div
                  key={h.id || h.job_id || Math.random()}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.22)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 900 }}>
                      🧠 {h.model_size || "—"} · {h.compute_tier || "—"} · {h.timeframe || "—"}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                      {h.symbols ? `Symbols: ${h.symbols}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", textAlign: "right" }}>
                    <div>{h.status || "done"}</div>
                    <div>{h.created_at || h.timestamp || ""}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>No history yet. Run a job and refresh.</div>
          )}
        </div>

        <div style={{ height: 30 }} />

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
          Tip: Keep Light + Local for fast iteration, then move Heavy → RunPod 80GB for serious training.
        </div>
      </div>
    </div>
  );
 };

 export default AILab;
