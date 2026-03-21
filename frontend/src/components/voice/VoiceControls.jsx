import React, { useRef, useState } from "react";

export default function VoiceControls({ onTranscript, speakText }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript && onTranscript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const speak = () => {
    if (!speakText) return;
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        onClick={startListening}
        style={{
          borderRadius: 12,
          padding: "10px 14px",
          background: listening ? "rgba(239,68,68,0.22)" : "#1f2937",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.10)",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {listening ? "🎙️ Listening..." : "🎤 Speak"}
      </button>

      <button
        onClick={speak}
        style={{
          borderRadius: 12,
          padding: "10px 14px",
          background: "#1f2937",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.10)",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        🔊 Speak Back
      </button>
    </div>
  );
}