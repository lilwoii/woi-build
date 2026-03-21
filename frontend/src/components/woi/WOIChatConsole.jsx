import React, { useEffect, useRef, useState } from "react";
import { woiApi } from "../../services/woiApi";
import WOIVoiceBar from "./WOIVoiceBar";

function Bubble({ side, children }) {
  const isUser = side === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "78%",
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        background: isUser ? "rgba(0,255,200,0.10)" : "rgba(10,14,18,0.60)",
        color: "rgba(240,255,250,0.95)",
        whiteSpace: "pre-wrap",
        lineHeight: 1.35
      }}>
        {children}
      </div>
    </div>
  );
}

export default function WOIChatConsole() {
  const [tier, setTier] = useState("deep");
  const [mode, setMode] = useState("assistant");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { side: "woi", text: "WOI online. Tell me what to watch, what rules to follow, or ask for analysis." }
  ]);

  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { side: "user", text: msg }]);
    setInput("");
    try {
      const res = await woiApi.chat(msg, tier, mode);
      setMessages((m) => [...m, { side: "woi", text: res.text || "(no response)" }]);
      // Optional voice output
      try {
        const synth = window.speechSynthesis;
        if (synth && res.text) {
          const u = new SpeechSynthesisUtterance(res.text.slice(0, 800));
          u.rate = 1.02;
          u.pitch = 1.0;
          synth.cancel();
          synth.speak(u);
        }
      } catch {}
    } catch (e) {
      setMessages((m) => [...m, { side: "woi", text: `Error: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 520,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.65)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
    }}>
      <div style={{ padding: 14, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, letterSpacing: 1 }}>WOI Console</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={tier} onChange={(e)=>setTier(e.target.value)} style={{ borderRadius: 10, padding: "6px 8px", background: "rgba(0,0,0,0.25)", color: "rgba(240,255,250,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="light">Light</option>
            <option value="deep">Deep</option>
          </select>
          <select value={mode} onChange={(e)=>setMode(e.target.value)} style={{ borderRadius: 10, padding: "6px 8px", background: "rgba(0,0,0,0.25)", color: "rgba(240,255,250,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="assistant">Assistant</option>
            <option value="analyst">Analyst</option>
            <option value="trader">Trader</option>
          </select>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{busy ? "thinking…" : "ready"}</div>
        </div>
      </div>

      <div style={{ padding: "0 14px 12px 14px" }}>
        <WOIVoiceBar onTranscript={(t)=>send(t)} />
      </div>

      <div style={{ flex: 1, padding: "0 14px 14px 14px", overflowY: "auto" }}>
        {messages.map((m, idx) => (
          <Bubble key={idx} side={m.side}>{m.text}</Bubble>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={(e)=>{ if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder='Try: "Watch TSLA this week. Rule: buy breakout with volume. If it fails, revert to auto."'
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,255,200,0.14)",
            background: "rgba(0,0,0,0.20)",
            color: "rgba(240,255,250,0.95)",
            outline: "none"
          }}
        />
        <button
          onClick={()=>send(input)}
          disabled={busy || !input.trim()}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,255,200,0.22)",
            background: "rgba(0,255,200,0.10)",
            color: "rgba(220,255,248,0.95)",
            cursor: "pointer",
            fontWeight: 800
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
