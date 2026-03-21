import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config";

/**
 * Small floating "ask the AI" widget.
 * - Posts to backend /coach/ask
 * - Keeps last messages locally in state
 */
const AIChatWidget = ({ symbol }) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [msgs, setMsgs] = useState([

  const loadStrategies = () => {
    try {
      const raw = localStorage.getItem("woi_strategies");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((s) => s && s.active) : [];
    } catch {
      return [];
    }
  };

    {
      role: "assistant",
      text: "Ask me anything: “what should I trade today?”, “scan TSLA”, “how do I improve my results?”",
    },
  ]);

  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 0);
  }, [open, msgs]);

  const send = async () => {
    const q = input.trim();
    if (!q || sending) return;

    setMsgs((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, strategies: loadStrategies() }),
      });
      const data = await res.json().catch(() => ({}));
      const answer = data?.answer || "No response yet.";
      setMsgs((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (e) {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Failed to reach backend. Check server logs." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: expanded ? "auto" : 18,
        top: expanded ? 70 : "auto",
        zIndex: 9999,
      }}
    >
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            borderRadius: "999px",
            border: "1px solid #111827",
            background: "radial-gradient(circle at top left, #22c55e, #0ea5e9, #6366f1)",
            color: "#0b1120",
            padding: "10px 14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          title="Ask Woi's AI"
        >
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontSize: 12 }}>Ask AI</span>
        </button>
      )}

      {open && (
        <div
          style={{
            width: 320,
            height: expanded ? 760 : 420,
            borderRadius: 16,
            border: "1px solid #111827",
            background: "#020617",
            color: "#e5e7eb",
            boxShadow: "0 15px 50px rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🤖</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em" }}>
                  AI Coach
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {symbol ? `Context: ${symbol}` : "No symbol context"}
                </div>
              </div>
            </div>

            <button
              onClick={() => { setOpen(false); setExpanded(false); }}
              style={{
                borderRadius: 10,
                border: "1px solid #111827",
                background: "transparent",
                color: "#e5e7eb",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
              }}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            style={{
              flex: 1,
              padding: "10px 12px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {msgs.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    padding: "8px 10px",
                    borderRadius: 14,
                    border: "1px solid #111827",
                    background: isUser ? "#111827" : "#020617",
                    color: "#e5e7eb",
                    fontSize: 12,
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.text}
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: 10,
              borderTop: "1px solid #111827",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Ask…"
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
              onClick={send}
              disabled={sending}
              style={{
                borderRadius: 999,
                border: "1px solid #38bdf8",
                background: "#020617",
                color: "#e5e7eb",
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                opacity: sending ? 0.65 : 1,
              }}
              title="Send"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;