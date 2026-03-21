import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

export default function OpenBB() {
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState("terminal"); // "browser" | "terminal"
  const [cmd, setCmd] = useState("obb --help");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const pillText = useMemo(() => {
    if (!status) return "Checking...";
    if (status.error) return "Backend unreachable";
    if (status.cli_detected && status.module_importable) return "Ready";
    if (status.cli_detected && !status.module_importable) return "CLI ok / Module missing";
    return "CLI missing";
  }, [status]);

  const refresh = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/openbb/status`);
      const j = await r.json();
      // backend may include suggested_next_step; keep it
      setStatus(j);
    } catch (e) {
      setStatus({ error: String(e) });
    }
  };

  useEffect(() => { refresh(); }, []);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/openbb/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd })
      });
      const j = await r.json();
      setOut(j?.stdout || j?.output || j?.stderr || JSON.stringify(j, null, 2));
    } catch (e) {
      setOut(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>OpenBB</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Full-feature access (browser + terminal mode)</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="pill">{pillText}</span>
        <button className={`pill softBtn ${mode === "browser" ? "pillActive" : ""}`} onClick={() => setMode("browser")}>
          Feature Browser
        </button>
        <button className={`pill softBtn ${mode === "terminal" ? "pillActive" : ""}`} onClick={() => setMode("terminal")}>
          Terminal Mode
        </button>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.04)" }}>
        <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
          <div><b>CLI detected:</b> {String(status?.cli_detected ?? "")} {status?.cli_path ? `(${status.cli_path})` : ""}</div>
          <div><b>Module importable:</b> {String(status?.module_importable ?? "")}</div>
          <div><b>Backend python:</b> {status?.python_executable || ""}</div>
          {status?.suggested_next_step ? <div><b>Next step:</b> {status.suggested_next_step}</div> : null}
          {status?.module_error ? <div><b>Module error:</b> {status.module_error}</div> : null}
          {status?.error ? <div><b>Error:</b> {status.error}</div> : null}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="softBtn" onClick={refresh}>Refresh</button>
          <button className="softBtn" onClick={() => setOut("")}>Clear</button>
        </div>
      </div>

      {mode === "terminal" ? (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "inherit"
              }}
            />
            <button className="softBtn softBtnPrimary" onClick={run} disabled={loading}>
              {loading ? "Running..." : "Run"}
            </button>
          </div>

          <pre style={{ whiteSpace: "pre-wrap", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", minHeight: 220 }}>
            {out}
          </pre>
        </>
      ) : (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14, background: "rgba(0,0,0,0.20)" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Feature Browser</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Presets will live here (search, quote, news, fundamentals). For now, switch to Terminal Mode to run CLI commands.
          </div>
        </div>
      )}
    </div>
  );
}
