import React, { useState } from "react";

export default function WOIConsole() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "🧠 WOI online. Talk to me freely about markets, strategy, life, ideas, or rules. I can also save strategies and route them to shadow.",
    },
  ]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setText("");

    try {
      const res = await fetch("/api/woi/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();

      const reply = data?.chat?.reply_text || "WOI did not respond.";
      const actions = data?.chat?.actions_taken || [];
      const structured = data?.chat?.structured || {};

      let extra = "";
      if (structured.strategy) {
        extra += `\n\n🧪 Strategy: ${structured.strategy.name}`;
        extra += `\n🎯 Symbol: ${structured.strategy.symbol}`;
        extra += `\n👻 Shadow-ready: ${actions.includes("shadow_requested") ? "Yes" : "No"}`;
      }
      if (structured.rule) {
        extra += `\n\n📘 Rule saved: ${structured.rule.title}`;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: reply + extra }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "⚠️ WOI chat request failed." }]);
    }
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>🗣️ WOI Console</div>
        <div style={{ opacity: 0.8 }}>
          Freeform conversation • strategy extraction • rule saving • shadow routing • memory-aware chat
        </div>
      </div>

      <div
        style={{
          background: "#0b1220",
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          minHeight: 420,
          display: "grid",
          gap: 10,
          alignContent: "start",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              justifySelf: msg.role === "user" ? "end" : "start",
              maxWidth: "78%",
              background: msg.role === "user" ? "rgba(59,130,246,0.20)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
              {msg.role === "user" ? "👤 You" : "🧠 WOI"}
            </div>
            {msg.text}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Talk to WOI freely... Example: Create a QQQ dip-buy strategy and send it to shadow."
          style={{
            minHeight: 100,
            borderRadius: 14,
            padding: 12,
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "0 18px",
            borderRadius: 14,
            background: "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}