import React, { useEffect, useState } from "react";
import AgentCard from "../components/agents/AgentCard";
import DecisionCard from "../components/agents/DecisionCard";

export default function AgentsLab() {
  const [agents, setAgents] = useState([]);
  const [mode, setMode] = useState("fast");
  const [text, setText] = useState("Urgent oil shipping route disruption raises macro and geopolitical risk.");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/woi/agents/registry");
      const data = await res.json();
      setAgents(data.items || []);
    };
    load();
  }, []);

  const deliberate = async () => {
    const res = await fetch(`/api/woi/agents/deliberate?mode=${encodeURIComponent(mode)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: text, summary: text, text }),
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 18, color: "#fff", display: "grid", gap: 16 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>🤖 Agents Lab</div>
        <div style={{ opacity: 0.8 }}>
          Multi-agent council • fast / deep / master deliberation • Discord-first alerting
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {agents.map((agent) => (
          <AgentCard key={agent.agent_id} agent={agent} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            minHeight: 100,
            borderRadius: 14,
            padding: 12,
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{
            borderRadius: 12,
            padding: 12,
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <option value="fast">Fast AI</option>
          <option value="deep">Deep AI</option>
          <option value="master">Master AI</option>
        </select>
        <button
          onClick={deliberate}
          style={{
            borderRadius: 12,
            padding: "0 18px",
            background: "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.10)",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Deliberate
        </button>
      </div>

      {result && (
        <>
          <div
            style={{
              background: "#0b1220",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              whiteSpace: "pre-wrap",
            }}
          >
            {result.summary}
            {"\n\n"}avg confidence: {result.avg_confidence}
            {"\n"}avg urgency: {result.avg_urgency}
            {"\n"}linked symbols: {(result.linked_symbols || []).join(", ") || "—"}
            {"\n"}prediction markets: {(result.linked_prediction_markets || []).join(", ") || "—"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {(result.decisions || []).map((item) => (
              <DecisionCard key={item.agent_id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}