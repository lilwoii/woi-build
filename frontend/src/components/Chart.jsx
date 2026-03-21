import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../config";

const TF_LABELS = ["1m","5m","15m","30m","1h","4h","1D","1W","1M","1Y"];
const TF_TO_SERVER = {
  "1m":"1Min","5m":"5Min","15m":"15Min","30m":"30Min","1h":"1Hour","4h":"4Hour",
  "1D":"1Day","1W":"1Week","1M":"1Month","1Y":"1Year"
};

// --- Demo bars + simple auto-trendline (Demo Mode) ---
function makeDemoBars(seed = 7, n = 240, start = 100) {
  let x = seed;
  const rand = () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
  let price = start;
  const out = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) {
    const t = now - i * 60_000;
    const drift = (rand() - 0.48) * 0.35;
    const vol = (rand() - 0.5) * 1.2;
    const o = price;
    const c = Math.max(1, o * (1 + drift / 100) + vol);
    const h = Math.max(o, c) + rand() * 1.6;
    const l = Math.min(o, c) - rand() * 1.6;
    price = c;
    out.push({ t, o, h, l, c });
  }
  return out;
}

function linReg(values) {
  const n = values.length;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (let i = 0; i < n; i++) {
    sx += i; sy += values[i]; sxy += i * values[i]; sx2 += i * i;
  }
  const denom = (n * sx2 - sx * sx) || 1;
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { m, b };
}

export default function Chart({ symbol = "TSLA", tf: tfProp = "1D", demoMode = true, aiInsight = null }) {
  const canvasRef = useRef(null);

  const [tf, setTf] = useState(tfProp);
  const [bars, setBars] = useState([]);
  const [error, setError] = useState(null);

  const demoInsight = useMemo(() => ({
    signal: "BUY",
    confidence: 78,
    reason: "Breakout + higher highs. Demo auto-trendline suggests bullish bias. Run Scan for live analysis."
  }), []);

  // fetch bars
  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setError(null);
        const serverTf = TF_TO_SERVER[tf] || "1Day";
        const url = `${API_BASE_URL}/proxy/bars?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(serverTf)}&limit=300&crypto=0`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const normalized = (data || []).map((r) => ({
          t: r.t || r.ts || r.time || Date.now(),
          o: r.o ?? r.open,
          h: r.h ?? r.high,
          l: r.l ?? r.low,
          c: r.c ?? r.close
        })).filter((b) => Number.isFinite(b.o) && Number.isFinite(b.h) && Number.isFinite(b.l) && Number.isFinite(b.c));

        if (!alive) return;
        if (demoMode && normalized.length === 0) {
          setBars(makeDemoBars(7, 240, 100));
        } else {
          setBars(normalized);
        }
      } catch (e) {
        if (!alive) return;
        setError("Failed to load chart");
        if (demoMode) setBars(makeDemoBars(7, 240, 100));
        else setBars([]);
      }
    };

    run();
    return () => { alive = false; };
  }, [symbol, tf, demoMode]);

  // draw
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const parent = c.parentElement;
    if (!parent) return;

    const draw = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w <= 10 || h <= 10) return;
      c.width = Math.floor(w * window.devicePixelRatio);
      c.height = Math.floor(h * window.devicePixelRatio);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

      ctx.clearRect(0, 0, w, h);

      // background grid
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = (h * (i + 1)) / 7;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (!bars || bars.length < 5) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "14px sans-serif";
        ctx.fillText(error || "No data yet", 16, 24);
        return;
      }

      const pad = 18;
      const plotW = w - pad * 2;
      const plotH = h - pad * 2;

      const highs = bars.map(b => b.h);
      const lows = bars.map(b => b.l);
      const maxP = Math.max(...highs);
      const minP = Math.min(...lows);
      const span = (maxP - minP) || 1;

      const xFor = (i) => pad + (i * plotW) / (bars.length - 1);
      const yFor = (p) => pad + (plotH - ((p - minP) / span) * plotH);

      // candles
      const bodyW = Math.max(2, plotW / bars.length * 0.6);
      for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        const x = xFor(i);
        const yO = yFor(b.o);
        const yC = yFor(b.c);
        const yH = yFor(b.h);
        const yL = yFor(b.l);

        const up = b.c >= b.o;
        ctx.strokeStyle = up ? "rgba(0,255,160,0.9)" : "rgba(255,80,80,0.9)";
        ctx.fillStyle = up ? "rgba(0,255,160,0.55)" : "rgba(255,80,80,0.55)";
        ctx.lineWidth = 1.2;

        // wick
        ctx.beginPath();
        ctx.moveTo(x, yH);
        ctx.lineTo(x, yL);
        ctx.stroke();

        // body
        const top = Math.min(yO, yC);
        const bot = Math.max(yO, yC);
        const bh = Math.max(2, bot - top);
        ctx.fillRect(x - bodyW / 2, top, bodyW, bh);
      }

      // auto trendline channel (demo mode)
      if (demoMode) {
        const closes = bars.map(b => b.c);
        const lr = linReg(closes);
        let sse = 0;
        for (let i = 0; i < closes.length; i++) {
          const yhat = lr.m * i + lr.b;
          const e = closes[i] - yhat;
          sse += e * e;
        }
        const std = Math.sqrt(sse / closes.length) || 1;
        const ch = std * 1.25;

        const line = (offset) => {
          ctx.beginPath();
          for (let i = 0; i < closes.length; i++) {
            const y = lr.m * i + lr.b + offset;
            const xx = xFor(i);
            const yy = yFor(y);
            if (i === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        };

        // fill channel
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "rgba(0,200,255,0.7)";
        ctx.beginPath();
        for (let i = 0; i < closes.length; i++) {
          const y = lr.m * i + lr.b + ch;
          const xx = xFor(i);
          const yy = yFor(y);
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        for (let i = closes.length - 1; i >= 0; i--) {
          const y = lr.m * i + lr.b - ch;
          const xx = xFor(i);
          const yy = yFor(y);
          ctx.lineTo(xx, yy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // center + bounds
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0,200,255,0.75)";
        line(0);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(0,200,255,0.45)";
        line(ch);
        line(-ch);

        // label
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "12px sans-serif";
        ctx.fillText("DEMO auto-trendline channel", 16, h - 14);
      }
    };

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bars, error, demoMode]);

  const insight = aiInsight || demoInsight;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* timeframe chips */}
      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 6, flexWrap: "wrap", zIndex: 2 }}>
        {TF_LABELS.map((k) => (
          <button
            key={k}
            className={`pill softBtn ${tf === k ? "pillActive" : ""}`}
            onClick={() => setTf(k)}
            style={{ padding: "6px 10px" }}
          >
            {k}
          </button>
        ))}
      </div>

      {/* demo analysis box */}
      {demoMode ? (
        <div data-testid="ai-analysis-box" style={{ position: "absolute", right: 12, top: 12, width: 320, padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", zIndex: 2 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>AI Demo Analysis</div>
          <div style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.35 }}>
            <div><b>Signal:</b> {insight.signal}</div>
            <div><b>Confidence:</b> {insight.confidence}%</div>
            <div style={{ marginTop: 6, opacity: 0.9 }}>{insight.reason}</div>
          </div>
        </div>
      ) : null}

      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
