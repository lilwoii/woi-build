import React, { useEffect, useState } from "react";
import VoiceControls from "../components/voice/VoiceControls";
import StrategyOpsBoard from "../components/ops/StrategyOpsBoard";
import DiscordOpsPanel from "../components/ops/DiscordOpsPanel";

export default function WOICommandCenter() {
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "🧠 WOI Command Center online. Talk freely, create strategies, save rules, or ask for a full market/world read.",
    },
  ]);
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    const loadFlights = async () => {
      const res = await fetch("/api/woi/conversation/flight-watch");
      const data = await res.json();
      setFlights(data.items || []);
    };
    loadFlights();
    const t = setInterval(loadFlights, 20000);
    return () => clearInterval(t);
  }, []);

  const sendMessage = async (overrideText) => {
    const content = (overrideText ?? text).trim();
    if (!content) return;

    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setText("");

    try {
      const res = await fetch("/api/woi/conversation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, session_id: sessionId || undefined }),
      });
      const data = await res.json();

      if (data.session_id && !sessionId) setSessionId(data.session_id);

      const reply = data.reply_text || "WOI returned no response.";
      setLastReply(reply);

      let extra = "";
      if (data.structured?.strategy) {
        extra += `\n\n🧪 Strategy extracted: ${data.structured.strategy.name}`;
      }
      if ((data.actions_taken || []).includes("shadow_requested")) {
        extra += `\n👻 Routed toward shadow workflow`;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: reply + extra }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: "⚠️ WOI conversation request failed." }]);
    }
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🗣️ WOI Command Center</div>
        <div style={{ opacity: 0.8 }}>
          Freeform AI conversation • Ollama bridge • voice hooks • strategy/rule capture • ops awareness
        </div>
      </div>

      <VoiceControls
        onTranscript={(transcript) => {
          setText(transcript);
          sendMessage(transcript);
        }}
        speakText={lastReply}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <div
          style={{
            background: "#0b1220",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            minHeight: 430,
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
                maxWidth: "82%",
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

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#0b1220", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight: 800, marginBottom: 12 }}>✈️ Flight / Transport Watch</div>
            <div style={{ display: "grid", gap: 10 }}>
              {flights.map((item) => (
                <div key={item.flight_id} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontWeight: 700 }}>{item.zone}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{item.region} • {item.urgency}</div>
                  <div style={{ marginTop: 6, opacity: 0.82 }}>{item.summary}</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                    🔗 {(item.linked_symbols || []).join(", ")} • 🎯 {(item.linked_prediction_markets || []).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DiscordOpsPanel />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Talk freely to WOI... Example: Create a BTC breakout strategy, save the rule that new ideas go to shadow first, and give me your market read."
          style={{
            minHeight: 110,
            borderRadius: 14,
            padding: 12,
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <button
          onClick={() => sendMessage()}
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

      <div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>📋 Strategy Ops Board</div>
        <StrategyOpsBoard />
      </div>
    </div>
  );
}