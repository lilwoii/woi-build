import React, { useEffect, useMemo, useRef, useState } from "react";

export default function WOIVoiceBar({ onTranscript }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const SpeechRecognition = useMemo(() => {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    setSupported(!!SpeechRecognition);
  }, [SpeechRecognition]);

  const start = () => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
      }
      if (finalText.trim()) onTranscript?.(finalText.trim());
    };

    rec.onend = () => setListening(false);

    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,14,18,0.60)"
    }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        Voice: {supported ? (listening ? "listening…" : "ready") : "not supported in this environment"}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={start}
          disabled={!supported || listening}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(0,255,200,0.20)",
            background: "rgba(0,255,200,0.10)",
            color: "rgba(210,255,245,0.95)",
            cursor: "pointer"
          }}
        >
          Start
        </button>
        <button
          onClick={stop}
          disabled={!supported || !listening}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,120,120,0.25)",
            background: "rgba(255,120,120,0.08)",
            color: "rgba(255,220,220,0.95)",
            cursor: "pointer"
          }}
        >
          Stop
        </button>
      </div>
    </div>
  );
}
